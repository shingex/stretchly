import { should as chaiShould } from 'chai'
import { afterAll, beforeAll } from 'vitest'
import { JSDOM } from 'jsdom'
import {
  applyWallpaperTheme,
  buildPosterCopy,
  isDuplicateText,
  supportFromText
} from '../app/utils/wallpaperBreakRenderer'

chaiShould()

describe('wallpaperBreakRenderer', () => {
  beforeAll(() => {
    global.document = new JSDOM('<!doctype html><html><body></body></html>').window.document
  })

  afterAll(() => {
    delete global.document
  })

  it('detects repeated poster copy', () => {
    isDuplicateText('Look Far', 'look far').should.equal(true)
    isDuplicateText('Open the window for a minute', 'window').should.equal(false)
  })

  it('drops support copy when it repeats the title', () => {
    supportFromText('A Softer Distance', 'A Softer Distance').should.equal('')
  })

  it('builds one headline with optional non-duplicate support', () => {
    const copy = buildPosterCopy({
      ideaTitle: 'Step away from the screen',
      ideaText: 'Let your eyes rest on something across the room. The next sentence stays out of the poster.',
      wallpaper: {
        keyword: 'misty forest',
        sourceName: 'Wikimedia Commons',
        authorName: 'A. Photographer',
        context: { timeOfDay: 'morning', weatherMood: 'mist' }
      },
      sanitizer: value => value
    })

    copy.label.should.equal('misty forest / morning / mist')
    copy.title.should.equal('Step away from the screen')
    copy.support.should.equal('Let your eyes rest on something across the room.')
    copy.meta.should.contain('Wikimedia Commons')
  })

  it('replaces the wallpaper when the dislike control is clicked', async () => {
    const dom = new JSDOM(`<!doctype html><html><body>
      <div class="breaks">
        <div>
          <div class="wallpaper-theme" aria-hidden="true">
            <img class="wallpaper-image" alt="">
            <div class="wallpaper-generated"></div>
            <div class="wallpaper-label"></div>
            <div class="wallpaper-title"></div>
            <div class="wallpaper-body"></div>
            <div class="wallpaper-meta"></div>
          </div>
        </div>
        <div></div>
      </div>
    </body></html>`)
    const previousDocument = global.document
    const previousWindow = global.window
    global.document = dom.window.document
    global.window = dom.window
    window.i18next = { t: async key => key }
    window.electronApi = {
      dislikeCurrentWallpaper: async () => ({
        id: 'next-wallpaper',
        keyword: 'quiet lake',
        colorA: '#111111',
        colorB: '#222222',
        colorC: '#333333',
        context: { timeOfDay: 'evening' }
      })
    }

    await applyWallpaperTheme({
      ideaTitle: 'Look away',
      ideaText: 'Rest your eyes.',
      options: {
        theme: 'wallpaper',
        wallpaper: {
          id: 'first-wallpaper',
          keyword: 'misty forest',
          colorA: '#aaaaaa',
          colorB: '#bbbbbb',
          colorC: '#cccccc',
          context: { timeOfDay: 'morning' }
        }
      },
      sanitizer: value => value
    })

    document.querySelector('.wallpaper-label').textContent.should.contain('misty forest')
    await document.querySelector('#dislike-wallpaper').onclick()
    document.querySelector('.wallpaper-label').textContent.should.contain('quiet lake')

    global.document = previousDocument
    global.window = previousWindow
  })

  it('keeps generated fallback visible until an image decodes', async () => {
    const dom = new JSDOM(`<!doctype html><html><body>
      <div class="breaks">
        <div>
          <div class="wallpaper-theme" aria-hidden="true">
            <img class="wallpaper-image" alt="">
            <div class="wallpaper-generated"></div>
            <div class="wallpaper-label"></div>
            <div class="wallpaper-title"></div>
            <div class="wallpaper-body"></div>
            <div class="wallpaper-meta"></div>
          </div>
        </div>
        <div></div>
      </div>
    </body></html>`)
    const previousDocument = global.document
    const previousWindow = global.window
    global.document = dom.window.document
    global.window = dom.window
    window.i18next = { t: async key => key }
    window.electronApi = {}

    const image = document.querySelector('.wallpaper-image')
    let resolveDecode
    image.decode = () => new Promise(resolve => {
      resolveDecode = resolve
    })

    const renderPromise = applyWallpaperTheme({
      ideaTitle: 'Look away',
      ideaText: 'Rest your eyes.',
      options: {
        theme: 'wallpaper',
        wallpaper: {
          id: 'remote-wallpaper',
          keyword: 'quiet lake',
          fileUrl: 'file:///tmp/wallpaper.jpg',
          context: { timeOfDay: 'evening' }
        }
      },
      sanitizer: value => value
    })

    document.querySelector('.wallpaper-theme').classList.contains('has-image').should.equal(false)
    resolveDecode()
    await renderPromise
    document.querySelector('.wallpaper-theme').classList.contains('has-image').should.equal(true)

    global.document = previousDocument
    global.window = previousWindow
  })
})
