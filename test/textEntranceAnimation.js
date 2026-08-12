import { should as chaiShould } from 'chai'
import { afterEach, beforeEach, describe, it } from 'vitest'
import { JSDOM } from 'jsdom'
import { animateTextEntrance, animateTextLoopOnly, scheduleTextEntrance, stopTextEntrance } from '../app/utils/textEntranceAnimation'

chaiShould()

const bootstrapDom = new JSDOM('<!doctype html><html><body></body></html>')
global.window = bootstrapDom.window
global.document = bootstrapDom.window.document
global.getComputedStyle = bootstrapDom.window.getComputedStyle.bind(bootstrapDom.window)

describe('textEntranceAnimation', () => {
  let previousDocument
  let previousWindow

  beforeEach(() => {
    previousDocument = global.document
    previousWindow = global.window
    const dom = new JSDOM('<!doctype html><html><body><div class="a">Alpha</div><div class="b">Beta</div></body></html>')
    global.document = dom.window.document
    global.window = dom.window
    window.matchMedia = () => ({ matches: false })
    global.getComputedStyle = window.getComputedStyle.bind(window)
  })

  afterEach(() => {
    global.document = previousDocument
    global.window = previousWindow
    global.getComputedStyle = global.window.getComputedStyle.bind(global.window)
  })

  it('marks visible text nodes for animation', () => {
    const timeline = animateTextEntrance([
      document.querySelector('.a'),
      document.querySelector('.b')
    ])

    timeline.should.not.equal(null)
    document.querySelector('.a').getAttribute('data-text-entrance').should.equal('true')
    document.querySelector('.b').getAttribute('data-text-entrance').should.equal('true')
  })

  it('skips motion when reduced motion is preferred', () => {
    window.matchMedia = () => ({ matches: true })

    const timeline = animateTextEntrance([
      document.querySelector('.a')
    ])

    ;(timeline === null).should.equal(true)
    document.querySelector('.a').getAttribute('data-text-entrance').should.equal('true')
  })

  it('clears previous text entrance markers before replaying', () => {
    animateTextEntrance([document.querySelector('.a')])
    animateTextEntrance([document.querySelector('.b')])

    document.querySelector('.a').hasAttribute('data-text-entrance').should.equal(false)
    document.querySelector('.b').getAttribute('data-text-entrance').should.equal('true')

    stopTextEntrance(document)
    document.querySelector('.b').hasAttribute('data-text-entrance').should.equal(false)
  })

  it('can defer text entrance until after the window is shown', async () => {
    window.requestAnimationFrame = undefined

    scheduleTextEntrance([
      document.querySelector('.a')
    ], { delayMs: 0 })

    document.querySelector('.a').hasAttribute('data-text-entrance').should.equal(false)
    await new Promise(resolve => window.setTimeout(resolve, 0))
    document.querySelector('.a').getAttribute('data-text-entrance').should.equal('true')
  })

  it('creates a readable infinite loop for visible text nodes', () => {
    const tween = animateTextLoopOnly([
      document.querySelector('.a'),
      document.querySelector('.b')
    ], { loopDuration: 2.4, loopStagger: 0.1 })

    tween.repeat().should.equal(-1)
    tween.yoyo().should.equal(true)
    tween.vars.duration.should.equal(2.4)
    document.querySelector('.a').getAttribute('data-text-entrance').should.equal('true')
  })
})
