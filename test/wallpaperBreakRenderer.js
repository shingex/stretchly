import { should as chaiShould } from 'chai'
import { afterAll, beforeAll } from 'vitest'
import { JSDOM } from 'jsdom'
import {
  analyzeImageForTypography,
  animateWallpaperText,
  applyWallpaperTheme,
  buildPosterCopy,
  generatePosterLayoutCandidates,
  isDuplicateText,
  scoreAndSelectLayout,
  selectWallpaperEntranceVariant,
  supportFromText
} from '../app/utils/wallpaperBreakRenderer'

chaiShould()

function shouldNotExist (value) {
  ;(value === null).should.equal(true)
}

function shouldExist (value) {
  ;(value !== null).should.equal(true)
}

const posterText = {
  displayTitle: '回到此刻',
  instruction: 'Look at the room beyond the screen.',
  subtitle: '',
  credit: 'Hidden source',
  category: 'Hidden category',
  isCjk: true,
  isShortWord: false,
  isShortCjk: false,
  length: 4
}

function analysisFixture (overrides = {}) {
  return {
    dominantPalette: {
      light: '#f2ead7',
      mutedLight: '#d7c9ad',
      dark: '#151817',
      mutedDark: '#303833'
    },
    lowDetailCandidateRegions: [{
      x: 0.18,
      y: 0.16,
      width: 0.54,
      height: 0.3,
      area: 58,
      avgBrightness: 172,
      avgTexture: 0.1,
      centerX: 0.45,
      centerY: 0.31
    }],
    openAreaRatio: 0.3,
    horizonEstimate: { y: 0.46, confidence: 0.18 },
    skyOrOpenAreaEstimate: 0.16,
    foregroundDensityEstimate: 0.14,
    recommendedMood: 'editorial-calm',
    safeZones: {},
    cells: [],
    width: 24,
    height: 14,
    avgBrightness: 150,
    avgDetail: 0.12,
    subject: 'subject-landscape',
    hue: 42,
    saturation: 0.22,
    ...overrides
  }
}

function selectedPosterClass (analysis, text = posterText) {
  const candidates = generatePosterLayoutCandidates(text, analysis, undefined, 'poster-test')
  return scoreAndSelectLayout(candidates, analysis, text).layoutClass
}

function selectedPoster (analysis, text = posterText) {
  const candidates = generatePosterLayoutCandidates(text, analysis, undefined, 'poster-test')
  return scoreAndSelectLayout(candidates, analysis, text).poster
}

function candidateBox (candidate) {
  const height = Math.min(Math.max((candidate.fontSize / 900) * candidate.lineHeight * (candidate.maxLines || 1), 0.06), 0.28)
  const isRight = candidate.anchor.includes('right')
  const isLeft = candidate.anchor.includes('left')
  const isCentered = !isLeft && !isRight && (candidate.anchor.includes('center') || candidate.anchor === 'open-area')
  const x = isCentered ? candidate.x - candidate.maxWidth / 2 : isRight ? candidate.x - candidate.maxWidth : candidate.x
  const y = candidate.y - height / 2
  return { x, y, width: candidate.maxWidth, height }
}

function expandedBox (box) {
  return {
    x: box.x - 0.09,
    y: box.y - 0.09,
    width: box.width + 0.18,
    height: box.height + 0.18
  }
}

function rectsOverlap (a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

function brightCells (width = 24, height = 14, brightness = 218, textureDensity = 0.08) {
  return Array.from({ length: width * height }, (_, index) => ({
    x: index % width,
    y: Math.floor(index / width),
    brightness,
    contrast: textureDensity,
    edgeStrength: textureDensity,
    saturation: 0.18,
    textureDensity,
    safe: true
  }))
}

const bootstrapDom = new JSDOM('<!doctype html><html><body></body></html>')
global.window = bootstrapDom.window
global.document = bootstrapDom.window.document
global.getComputedStyle = bootstrapDom.window.getComputedStyle.bind(bootstrapDom.window)

describe('wallpaperBreakRenderer', () => {
  beforeAll(() => {
    const dom = new JSDOM('<!doctype html><html><body></body></html>')
    global.document = dom.window.document
    global.window = dom.window
    global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window)
  })

  afterAll(() => {
    global.document = bootstrapDom.window.document
    global.window = bootstrapDom.window
    global.getComputedStyle = bootstrapDom.window.getComputedStyle.bind(bootstrapDom.window)
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

  it('analyzes image cells for typography-safe poster regions', () => {
    const width = 24
    const height = 14
    const data = new Uint8ClampedArray(width * height * 4)
    for (let index = 0; index < data.length; index += 4) {
      data[index] = 215
      data[index + 1] = 220
      data[index + 2] = 210
      data[index + 3] = 255
    }

    const analysis = analyzeImageForTypography({
      data,
      width,
      height,
      wallpaper: { keyword: 'open sky' }
    })

    analysis.lowDetailCandidateRegions.length.should.be.greaterThan(0)
    analysis.lowDetailCandidateRegions[0].y.should.be.greaterThan(0)
    analysis.lowDetailCandidateRegions[0].y.should.be.lessThan(0.84)
    analysis.skyOrOpenAreaEstimate.should.be.greaterThan(0.2)
  })

  it('uses palette and subject avoidance regions in image analysis', () => {
    const width = 24
    const height = 14
    const data = new Uint8ClampedArray(width * height * 4)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4
        const inSubject = x >= 8 && x <= 15 && y >= 4 && y <= 8
        data[index] = inSubject ? 30 : 218
        data[index + 1] = inSubject ? 80 : 210
        data[index + 2] = inSubject ? 120 : 190
        data[index + 3] = 255
      }
    }

    const analysis = analyzeImageForTypography({
      data,
      width,
      height,
      wallpaper: { keyword: 'lake subject' },
      palette: [{ r: 218, g: 210, b: 190 }, { r: 30, g: 80, b: 120 }],
      subjectAvoidanceRegions: [{ x: 8 / width, y: 4 / height, width: 8 / width, height: 5 / height, source: 'smartcrop', weight: 1 }]
    })

    analysis.dominantColors.length.should.equal(2)
    analysis.edgeDensityMap.length.should.equal(height)
    analysis.subjectAvoidanceRegions.some(region => region.source === 'smartcrop').should.equal(true)
    analysis.lowDetailCandidateRegions.some(region => {
      const centerX = region.centerX
      const centerY = region.centerY
      return centerX > 8 / width && centerX < 16 / width && centerY > 4 / height && centerY < 9 / height
    }).should.equal(false)
  })

  it('selects the expected poster preset for open sky images', () => {
    selectedPosterClass(analysisFixture({
      openAreaRatio: 0.38,
      skyOrOpenAreaEstimate: 0.42,
      horizonEstimate: { y: 0.52, confidence: 0.16 },
      recommendedMood: 'open-sky'
    })).should.equal('poster-hero-sky-center')
  })

  it('selects the horizon preset for clear horizon images', () => {
    selectedPosterClass(analysisFixture({
      openAreaRatio: 0.32,
      skyOrOpenAreaEstimate: 0.18,
      horizonEstimate: { y: 0.44, confidence: 0.62 },
      recommendedMood: 'horizon-calm'
    })).should.equal('poster-horizon-overlay')
  })

  it('selects the editorial preset for calm landscape images', () => {
    selectedPosterClass(analysisFixture({
      openAreaRatio: 0.28,
      skyOrOpenAreaEstimate: 0.12,
      horizonEstimate: { y: 0.5, confidence: 0.22 },
      avgDetail: 0.1,
      subject: 'subject-landscape'
    })).should.equal('poster-landscape-editorial')
  })

  it('selects the lock-screen depth preset for strong foreground forest images', () => {
    selectedPosterClass(analysisFixture({
      lowDetailCandidateRegions: [{
        x: 0.08,
        y: 0.22,
        width: 0.34,
        height: 0.24,
        area: 24,
        avgBrightness: 126,
        avgTexture: 0.28,
        centerX: 0.25,
        centerY: 0.34
      }],
      openAreaRatio: 0.14,
      skyOrOpenAreaEstimate: 0.08,
      horizonEstimate: { y: 0.5, confidence: 0.12 },
      avgDetail: 0.3,
      subject: 'subject-plant',
      recommendedMood: 'quiet-natural'
    })).should.equal('poster-depth-lockscreen-poster')
  })

  it('selects the full typographic poster preset for clean open images without sky or horizon cues', () => {
    selectedPosterClass(analysisFixture({
      openAreaRatio: 0.48,
      skyOrOpenAreaEstimate: 0.14,
      horizonEstimate: { y: 0.52, confidence: 0.16 },
      avgDetail: 0.08,
      subject: 'subject-texture',
      recommendedMood: 'editorial-calm'
    })).should.equal('poster-full-typographic-poster')
  })

  it('keeps Chinese rest instructions at calm poster scale over lake landscapes', () => {
    const text = {
      displayTitle: '上下转动眼睛',
      instruction: '让视线慢慢经过画面上下边缘。',
      category: 'mountain lake / calm',
      credit: 'Stretchly',
      isCjk: true,
      isShortWord: false,
      isShortCjk: false,
      isInstructionTitle: true,
      length: 6
    }
    const poster = selectedPoster(analysisFixture({
      lowDetailCandidateRegions: [{
        x: 0.08,
        y: 0.18,
        width: 0.34,
        height: 0.24,
        area: 30,
        avgBrightness: 168,
        avgTexture: 0.12,
        centerX: 0.25,
        centerY: 0.3
      }],
      openAreaRatio: 0.38,
      skyOrOpenAreaEstimate: 0.2,
      horizonEstimate: { y: 0.44, confidence: 0.48 },
      subject: 'subject-landscape',
      avgDetail: 0.12,
      salientRegions: [{ x: 0.36, y: 0.38, width: 0.28, height: 0.22, area: 12, avgSalience: 0.42 }]
    }), text)
    const box = candidateBox(poster)

    ;['CalmInstructionPoster', 'MinimalPhrase', 'LandscapeEditorial'].includes(poster.layoutType).should.equal(true)
    ;['HeroSkyCenter', 'FullTypographicPoster'].includes(poster.layoutType).should.equal(false)
    poster.maxLines.should.be.at.most(2)
    poster.maxWidth.should.be.at.least(0.2)
    poster.maxWidth.should.be.at.most(0.36)
    ;(poster.fontSize / 900).should.be.at.most(0.16)
    ;(box.height).should.be.at.most(0.28)
    ;(box.y + box.height).should.be.below(0.82)
    poster.showInstruction.should.equal(true)
    poster.showCategory.should.equal(true)
    poster.showCredit.should.equal(true)
  })

  it('returns explicit layout rectangles and dispersed metadata slots', () => {
    const text = {
      displayTitle: '重置坐姿',
      instruction: '双脚踩实，臀部坐到椅背处，肩膀放松下沉。',
      category: 'quiet chair study',
      credit: 'Stretchly',
      isCjk: true,
      isShortWord: false,
      isShortCjk: false,
      isInstructionTitle: true,
      length: 4
    }
    const poster = selectedPoster(analysisFixture({
      openAreaRatio: 0.32,
      skyOrOpenAreaEstimate: 0.12,
      horizonEstimate: { y: 0.5, confidence: 0.16 },
      avgDetail: 0.18,
      subject: 'subject-interior',
      salientRegions: [{ x: 0.36, y: 0.24, width: 0.3, height: 0.38, area: 12, avgSalience: 0.44 }]
    }), text)

    poster.layoutType.should.equal('CalmInstructionPoster')
    poster.titleRect.width.should.be.at.most(0.36)
    poster.instructionRect.should.be.an('object')
    ;[poster.categoryRect, poster.creditRect].filter(Boolean)
      .every(rect => !rectsOverlap(rect, expandedBox(candidateBox(poster))) && !rectsOverlap(rect, poster.instructionRect))
      .should.equal(true)
    if (poster.categorySlot) poster.categorySlot.name.should.not.equal('nearTitleSmall')
    if (poster.creditSlot) poster.creditSlot.name.should.not.equal('nearTitleSmall')
    poster.metadataOpacity.should.be.within(0.35, 0.7)
  })

  it('keeps short Chinese instruction titles semantically intact over complex flowers', () => {
    const text = {
      displayTitle: '让眼睛休息',
      instruction: '闭眼 20 秒，放松下巴，同时让肩膀自然下沉。',
      category: 'flower field / calm',
      credit: 'Stretchly',
      isCjk: true,
      isShortWord: false,
      isShortCjk: false,
      isInstructionTitle: true,
      length: 6
    }
    const poster = selectedPoster(analysisFixture({
      lowDetailCandidateRegions: [{
        x: 0.12,
        y: 0.12,
        width: 0.56,
        height: 0.3,
        area: 42,
        avgBrightness: 118,
        avgTexture: 0.16,
        centerX: 0.4,
        centerY: 0.27
      }],
      openAreaRatio: 0.24,
      skyOrOpenAreaEstimate: 0.18,
      foregroundDensityEstimate: 0.48,
      avgBrightness: 118,
      avgDetail: 0.28,
      subject: 'subject-plant',
      salientRegions: [{ x: 0.28, y: 0.42, width: 0.42, height: 0.32, area: 18, avgSalience: 0.44 }]
    }), text)
    const box = candidateBox(poster)
    const avoidBox = expandedBox(box)

    ;['CalmInstructionPoster', 'MinimalPhrase'].includes(poster.layoutType).should.equal(true)
    poster.titleLines.should.deep.equal(['让眼睛休息'])
    poster.maxLines.should.equal(1)
    poster.maxWidth.should.be.within(0.24, 0.38)
    box.height.should.be.below(0.22)
    box.x.should.be.at.least(0.12)
    poster.showInstruction.should.equal(true)
    ;[poster.categoryRect, poster.creditRect].filter(Boolean).every(rect => !rectsOverlap(rect, avoidBox)).should.equal(true)
    poster.scrimOpacity.should.be.at.most(0.28)
  })

  it('uses semantic two-line Chinese breaks without splitting protected words', () => {
    const text = {
      displayTitle: '检查注意力和坐姿',
      instruction: '呼吸放慢，重新坐稳。',
      category: 'desk calm',
      credit: 'Stretchly',
      isCjk: true,
      isShortWord: false,
      isShortCjk: false,
      isInstructionTitle: true,
      length: 8
    }
    const poster = selectedPoster(analysisFixture({
      avgDetail: 0.2,
      subject: 'subject-interior'
    }), text)

    poster.titleLines.length.should.be.at.most(2)
    poster.titleLines.some(line => line.length < 3).should.equal(false)
    poster.titleLines.join('').should.equal('检查注意力和坐姿')
    poster.titleLines.includes('检查注').should.equal(false)
    poster.titleLines.includes('意力和坐姿').should.equal(false)
  })

  it('uses local contrast colors and separates metadata over bright lake skies', () => {
    const text = {
      displayTitle: '听见三个声音',
      instruction: '停下来，依次注意三个你能听见的声音。',
      category: 'mountain lake / morning',
      credit: 'Stretchly',
      isCjk: true,
      isShortWord: false,
      isShortCjk: false,
      isInstructionTitle: true,
      length: 6
    }
    const poster = selectedPoster(analysisFixture({
      lowDetailCandidateRegions: [{
        x: 0.14,
        y: 0.12,
        width: 0.62,
        height: 0.28,
        area: 56,
        avgBrightness: 224,
        avgTexture: 0.06,
        centerX: 0.45,
        centerY: 0.26
      }],
      cells: brightCells(),
      avgBrightness: 216,
      avgDetail: 0.08,
      openAreaRatio: 0.42,
      skyOrOpenAreaEstimate: 0.36,
      horizonEstimate: { y: 0.52, confidence: 0.18 },
      subject: 'subject-landscape'
    }), text)
    const avoidBox = expandedBox(candidateBox(poster))

    poster.color.should.match(/^#1[0-9a-f]{5}|^#2[0-9a-f]{5}/)
    poster.titleContrast.should.be.at.least(3)
    poster.instructionContrast.should.be.at.least(3)
    poster.metadataContrast.should.be.at.least(2)
    poster.titleOpacity.should.be.at.least(0.72)
    poster.instructionOpacity.should.be.at.least(0.65)
    poster.metadataOpacity.should.be.at.least(0.45)
    ;[poster.categoryRect, poster.creditRect].filter(Boolean).every(rect => !rectsOverlap(rect, avoidBox)).should.equal(true)
    ;[poster.categoryRect, poster.creditRect].filter(Boolean).length.should.be.at.least(1)
    if (poster.categoryRect && poster.creditRect) rectsOverlap(poster.categoryRect, poster.creditRect).should.equal(false)
  })

  it('does not keep long metadata beside large Chinese instruction titles', () => {
    const text = {
      displayTitle: '上下转动眼睛',
      instruction: '头保持不动，眼睛看向屏幕上沿，再看向键盘，重复 5 次。',
      category: 'Unsplash / Peter Burdon',
      credit: 'Out to Dusk / Until Moonlight',
      isCjk: true,
      isShortWord: false,
      isShortCjk: false,
      isInstructionTitle: true,
      length: 6
    }
    const poster = selectedPoster(analysisFixture({
      lowDetailCandidateRegions: [{
        x: 0.18,
        y: 0.18,
        width: 0.52,
        height: 0.3,
        area: 48,
        avgBrightness: 128,
        avgTexture: 0.1,
        centerX: 0.44,
        centerY: 0.32
      }],
      avgBrightness: 130,
      avgDetail: 0.1,
      openAreaRatio: 0.38,
      skyOrOpenAreaEstimate: 0.32,
      horizonEstimate: { y: 0.42, confidence: 0.18 },
      subject: 'subject-landscape'
    }), text)
    const avoidBox = expandedBox(candidateBox(poster))
    const metadataRects = [poster.categoryRect, poster.creditRect].filter(Boolean)

    metadataRects.every(rect => !rectsOverlap(rect, avoidBox)).should.equal(true)
    metadataRects.every(rect => !rectsOverlap(rect, poster.instructionRect)).should.equal(true)
    metadataRects.length.should.be.at.most(1)
  })

  it('treats short Chinese mindfulness prompts with instruction copy as poster instruction layouts', () => {
    const text = {
      displayTitle: '说出一件好事',
      instruction: '想一件今天已经发生的具体好事，即使很小也可以。',
      category: 'mountain lake / night / moonlight',
      credit: 'Unsplash / Anthony Maw',
      isCjk: true,
      isShortWord: false,
      isShortCjk: false,
      isInstructionTitle: false,
      isInstructionPoster: true,
      length: 6
    }
    const poster = selectedPoster(analysisFixture({
      lowDetailCandidateRegions: [{
        x: 0.08,
        y: 0.14,
        width: 0.56,
        height: 0.28,
        area: 52,
        avgBrightness: 96,
        avgTexture: 0.12,
        centerX: 0.36,
        centerY: 0.28
      }],
      avgBrightness: 92,
      avgDetail: 0.14,
      openAreaRatio: 0.36,
      skyOrOpenAreaEstimate: 0.34,
      horizonEstimate: { y: 0.46, confidence: 0.2 },
      subject: 'subject-landscape'
    }), text)
    const avoidBox = expandedBox(candidateBox(poster))
    const metadataRects = [poster.categoryRect, poster.creditRect].filter(Boolean)

    ;['CalmInstructionPoster', 'MinimalPhrase', 'LandscapeEditorial'].includes(poster.layoutType).should.equal(true)
    metadataRects.every(rect => !rectsOverlap(rect, avoidBox)).should.equal(true)
    metadataRects.every(rect => !rectsOverlap(rect, poster.instructionRect)).should.equal(true)
    metadataRects.length.should.be.at.most(1)
  })

  it('discards poster candidates that collide with screen UI zones', () => {
    const candidates = generatePosterLayoutCandidates(posterText, analysisFixture({
      lowDetailCandidateRegions: [{
        x: 0.72,
        y: 0.06,
        width: 0.24,
        height: 0.18,
        area: 20,
        avgBrightness: 190,
        avgTexture: 0.08,
        centerX: 0.9,
        centerY: 0.09
      }],
      openAreaRatio: 0.42,
      skyOrOpenAreaEstimate: 0.4
    }), undefined, 'top-right-risk')

    candidates.every(candidate => {
      const box = candidateBox(candidate)
      const avoidsBottom = box.y + box.height < 0.82
      const avoidsTopRight = !(box.x < 1 && box.x + box.width > 0.9 && box.y < 0.12 && box.y + box.height > 0)
      return avoidsBottom && avoidsTopRight
    }).should.equal(true)
  })

  it('limits wallpaper animation randomness to quiet poster variants', () => {
    const previousRandom = Math.random
    const approved = ['drift', 'fade', 'breathe']

    try {
      for (let index = 0; index < approved.length; index++) {
        Math.random = () => index / approved.length
        selectWallpaperEntranceVariant().should.equal(approved[index])
      }
    } finally {
      Math.random = previousRandom
    }
  })

  it('delays scheduled wallpaper entrance by two seconds', () => {
    const dom = new JSDOM(`<!doctype html><html><body>
      <div class="wallpaper-theme" aria-hidden="true">
        <img class="wallpaper-image" alt="">
            <img class="wallpaper-depth-image" alt="" aria-hidden="true">
        <div class="wallpaper-generated"></div>
        <div class="wallpaper-top-meta" aria-hidden="true">
          <div class="wallpaper-label">quiet lake</div>
          <div class="wallpaper-mood">evening</div>
          <div class="wallpaper-meta">Stretchly</div>
        </div>
        <div class="wallpaper-text">
          <div class="wallpaper-title">Look Away</div>
          <div class="wallpaper-body">Rest your eyes.</div>
        </div>
      </div>
    </body></html>`)
    const previousDocument = global.document
    const previousWindow = global.window
    global.document = dom.window.document
    global.window = dom.window
    global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window)

    let scheduledDelay
    const previousSetTimeout = window.setTimeout
    window.setTimeout = (callback, delay) => {
      scheduledDelay = delay
      return 1
    }

    animateWallpaperText({ scheduled: true, variant: 'fade' })

    scheduledDelay.should.equal(2000)
    document.querySelector('.wallpaper-title').getAttribute('data-text-entrance').should.equal('true')

    window.setTimeout = previousSetTimeout
    global.document = previousDocument
    global.window = previousWindow
    global.getComputedStyle = previousWindow.getComputedStyle.bind(previousWindow)
  })

  it('uses shared wallpaper copy and prepares text without delaying the image', async () => {
    const dom = new JSDOM(`<!doctype html><html><body>
      <div class="breaks">
        <div>
          <div class="wallpaper-theme" aria-hidden="true">
            <img class="wallpaper-image" alt="">
            <img class="wallpaper-depth-image" alt="" aria-hidden="true">
            <div class="wallpaper-generated"></div>
            <div class="wallpaper-top-meta" aria-hidden="true">
              <div class="wallpaper-label"></div>
              <div class="wallpaper-mood"></div>
              <div class="wallpaper-meta"></div>
            </div>
            <div class="wallpaper-text">
              <div class="wallpaper-title"></div>
              <div class="wallpaper-body"></div>
            </div>
          </div>
        </div>
        <div></div>
      </div>
    </body></html>`)
    const previousDocument = global.document
    const previousWindow = global.window
    global.document = dom.window.document
    global.window = dom.window
    global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window)
    window.i18next = { t: async key => key }
    window.electronApi = {}

    const image = document.querySelector('.wallpaper-image')
    image.decode = async () => {}

    await applyWallpaperTheme({
      ideaTitle: 'Local idea',
      ideaText: 'Local support.',
      options: {
        theme: 'wallpaper',
        wallpaper: {
          id: 'shared-wallpaper',
          keyword: 'quiet lake',
          fileUrl: 'file:///tmp/shared.jpg',
          context: { timeOfDay: 'evening' }
        },
        wallpaperText: {
          label: 'shared label',
          title: 'Shared title',
          support: 'Shared support.',
          meta: 'Shared meta'
        }
      },
      sanitizer: value => value,
      animate: false,
      prepareText: true
    })

    document.querySelector('.wallpaper-theme').classList.contains('has-image').should.equal(true)
    document.querySelector('.wallpaper-label').textContent.should.equal('shared label')
    document.querySelector('.wallpaper-label').hidden.should.equal(false)
    document.querySelector('.wallpaper-mood').textContent.should.equal('')
    document.querySelector('.wallpaper-mood').hidden.should.equal(true)
    shouldExist(document.querySelector('.wallpaper-top-meta .wallpaper-label'))
    shouldExist(document.querySelector('.wallpaper-top-meta .wallpaper-mood'))
    shouldExist(document.querySelector('.wallpaper-top-meta .wallpaper-meta'))
    shouldNotExist(document.querySelector('.wallpaper-text .wallpaper-label'))
    shouldNotExist(document.querySelector('.wallpaper-text .wallpaper-mood'))
    shouldNotExist(document.querySelector('.wallpaper-text .wallpaper-meta'))
    document.querySelector('.wallpaper-title').textContent.should.equal('Shared title')
    document.querySelector('.wallpaper-body').hidden.should.equal(false)
    document.querySelector('.wallpaper-meta').textContent.should.equal('Shared meta')
    document.querySelector('.wallpaper-meta').hidden.should.equal(false)
    document.querySelectorAll('.wallpaper-title-word').length.should.equal(1)
    document.querySelectorAll('.wallpaper-title-word.is-emphasis').length.should.equal(0)
    document.querySelector('.wallpaper-theme').classList.contains('poster-centered-simple').should.equal(true)
    document.querySelector('.wallpaper-theme').style.getPropertyValue('--center-title-primary-size').should.match(/px$/)
    document.querySelector('.wallpaper-title').getAttribute('data-text-entrance').should.equal('true')
    document.querySelector('.wallpaper-title').style.opacity.should.equal('0')

    global.document = previousDocument
    global.window = previousWindow
    global.getComputedStyle = previousWindow.getComputedStyle.bind(previousWindow)
  })

  it('replaces the wallpaper when the dislike control is clicked', async () => {
    const dom = new JSDOM(`<!doctype html><html><body>
      <div class="breaks">
        <div>
          <div class="wallpaper-theme" aria-hidden="true">
            <img class="wallpaper-image" alt="">
            <img class="wallpaper-depth-image" alt="" aria-hidden="true">
            <div class="wallpaper-generated"></div>
            <div class="wallpaper-top-meta" aria-hidden="true">
              <div class="wallpaper-label"></div>
              <div class="wallpaper-mood"></div>
              <div class="wallpaper-meta"></div>
            </div>
            <div class="wallpaper-text">
              <div class="wallpaper-title"></div>
              <div class="wallpaper-body"></div>
            </div>
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

    document.querySelector('.wallpaper-label').hidden.should.equal(false)
    const theme = document.querySelector('.wallpaper-theme')
    const typographyClass = [...theme.classList].find(className => className.startsWith('typography-'))
    typographyClass.should.be.a('string')
    document.querySelector('.wallpaper-title').getAttribute('data-text-entrance').should.equal('true')
    await document.querySelector('#dislike-wallpaper').onclick()
    document.querySelector('.wallpaper-label').hidden.should.equal(false)
    const typographyClasses = [...theme.classList].filter(className => className.startsWith('typography-'))
    typographyClasses.length.should.equal(1)
    document.querySelector('.wallpaper-title').getAttribute('data-text-entrance').should.equal('true')

    global.document = previousDocument
    global.window = previousWindow
  })

  it('keeps generated fallback visible until an image decodes', async () => {
    const dom = new JSDOM(`<!doctype html><html><body>
      <div class="breaks">
        <div>
          <div class="wallpaper-theme" aria-hidden="true">
            <img class="wallpaper-image" alt="">
            <img class="wallpaper-depth-image" alt="" aria-hidden="true">
            <div class="wallpaper-generated"></div>
            <div class="wallpaper-top-meta" aria-hidden="true">
              <div class="wallpaper-label"></div>
              <div class="wallpaper-mood"></div>
              <div class="wallpaper-meta"></div>
            </div>
            <div class="wallpaper-text">
              <div class="wallpaper-title"></div>
              <div class="wallpaper-body"></div>
            </div>
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

  it('uses one simple centered poster layout instead of corner info-block templates', async () => {
    const dom = new JSDOM(`<!doctype html><html><body>
      <div class="breaks">
        <div>
          <div class="wallpaper-theme" aria-hidden="true">
            <img class="wallpaper-image" alt="">
            <img class="wallpaper-depth-image" alt="" aria-hidden="true">
            <div class="wallpaper-generated"></div>
            <div class="wallpaper-top-meta" aria-hidden="true">
              <div class="wallpaper-label"></div>
              <div class="wallpaper-mood"></div>
              <div class="wallpaper-meta"></div>
            </div>
            <div class="wallpaper-text">
              <div class="wallpaper-title"></div>
              <div class="wallpaper-body"></div>
            </div>
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

    await applyWallpaperTheme({
      ideaTitle: 'Little by little, day by day, what is meant for you will find its way',
      ideaText: 'Let your eyes rest.',
      options: {
        theme: 'wallpaper',
        wallpaper: {
          id: 'long-title-wallpaper',
          keyword: 'mountain lake',
          colorA: '#8aa58f',
          colorB: '#d8c98e',
          colorC: '#24463f'
        }
      },
      sanitizer: value => value,
      animate: false
    })

    const theme = document.querySelector('.wallpaper-theme')
    const oldTemplateLayouts = [
      'layout-left',
      'layout-right',
      'layout-center',
      'layout-bottom',
      'layout-side-note',
      'layout-field-card',
      'layout-poster-stack',
      'layout-caption-strip'
    ]
    oldTemplateLayouts.some(className => theme.classList.contains(className)).should.equal(false)
    theme.classList.contains('poster-layout').should.equal(true)
    theme.classList.contains('poster-centered-simple').should.equal(true)
    theme.classList.contains('poster-anchor-center').should.equal(true)
    theme.classList.contains('subject-landscape').should.equal(true)
    theme.classList.contains('typography-impact').should.equal(false)
    theme.classList.contains('typography-quote').should.equal(false)
    theme.style.getPropertyValue('--center-title-primary-size').should.match(/px$/)

    global.document = previousDocument
    global.window = previousWindow
  })

  it('renders a Chinese centered poster with an English title line and no metadata', async () => {
    const dom = new JSDOM(`<!doctype html><html><body>
      <div class="breaks">
        <div>
          <div class="wallpaper-theme" aria-hidden="true">
            <img class="wallpaper-image" alt="">
            <img class="wallpaper-depth-image" alt="" aria-hidden="true">
            <div class="wallpaper-generated"></div>
            <div class="wallpaper-top-meta" aria-hidden="true">
              <div class="wallpaper-label"></div>
              <div class="wallpaper-mood"></div>
              <div class="wallpaper-meta"></div>
            </div>
            <div class="wallpaper-text">
              <div class="wallpaper-title"></div>
              <div class="wallpaper-body"></div>
            </div>
          </div>
        </div>
        <div></div>
      </div>
    </body></html>`, { pretendToBeVisual: true })
    const previousDocument = global.document
    const previousWindow = global.window
    global.document = dom.window.document
    global.window = dom.window
    global.window.innerWidth = 1536
    window.i18next = { t: async key => key }
    window.electronApi = {}

    await applyWallpaperTheme({
      ideaTitle: '拇指碰指尖',
      ideaText: '拇指依次碰每个指尖，再倒序做一遍。',
      options: {
        theme: 'wallpaper',
        wallpaper: { id: 'generated', keyword: 'coastal grass' },
        wallpaperText: {
          title: '拇指碰指尖',
          subtitle: 'Touch thumb to fingers',
          support: '拇指依次碰每个指尖，再倒序做一遍。',
          label: 'coastal grass / night / moonlight',
          meta: 'Kaja Kadlecova'
        }
      },
      sanitizer: value => value,
      animate: false
    })

    const theme = document.querySelector('.wallpaper-theme')
    theme.classList.contains('poster-centered-simple').should.equal(true)
    document.querySelector('.wallpaper-title-primary').textContent.should.equal('拇指碰指尖')
    document.querySelector('.wallpaper-title-secondary').textContent.should.equal('TOUCH THUMB TO FINGERS')
    document.querySelector('.wallpaper-body').textContent.should.equal('拇指依次碰每个指尖，再倒序做一遍。')
    document.querySelector('.wallpaper-label').textContent.should.equal('coastal grass')
    document.querySelector('.wallpaper-label').hidden.should.equal(false)
    document.querySelector('.wallpaper-mood').textContent.should.equal('night / moonlight')
    document.querySelector('.wallpaper-mood').hidden.should.equal(false)
    document.querySelector('.wallpaper-meta').textContent.should.equal('Kaja Kadlecova')
    document.querySelector('.wallpaper-meta').hidden.should.equal(false)
    theme.style.getPropertyValue('--center-title-primary-size').should.match(/px$/)
    theme.style.getPropertyValue('--center-title-secondary-size').should.match(/px$/)

    global.document = previousDocument
    global.window = previousWindow
  })

  it('renders English wallpaper text as one title line without a Chinese title', async () => {
    const dom = new JSDOM(`<!doctype html><html><body>
      <div class="breaks">
        <div>
          <div class="wallpaper-theme" aria-hidden="true">
            <img class="wallpaper-image" alt="">
            <img class="wallpaper-depth-image" alt="" aria-hidden="true">
            <div class="wallpaper-generated"></div>
            <div class="wallpaper-top-meta" aria-hidden="true">
              <div class="wallpaper-label"></div>
              <div class="wallpaper-mood"></div>
              <div class="wallpaper-meta"></div>
            </div>
            <div class="wallpaper-text">
              <div class="wallpaper-title"></div>
              <div class="wallpaper-body"></div>
            </div>
          </div>
        </div>
        <div></div>
      </div>
    </body></html>`, { pretendToBeVisual: true })
    const previousDocument = global.document
    const previousWindow = global.window
    global.document = dom.window.document
    global.window = dom.window
    global.window.innerWidth = 1536
    window.i18next = { t: async key => key }
    window.electronApi = {}

    await applyWallpaperTheme({
      ideaTitle: 'Touch thumb to fingers',
      ideaText: 'Touch thumb to each fingertip one by one, then reverse the order.',
      options: {
        theme: 'wallpaper',
        wallpaper: { id: 'generated', keyword: 'coastal grass' }
      },
      sanitizer: value => value,
      animate: false
    })

    document.querySelector('.wallpaper-title-primary').textContent.should.equal('Touch thumb to fingers')
    shouldNotExist(document.querySelector('.wallpaper-title-secondary'))
    document.querySelector('.wallpaper-title').textContent.should.not.contain('拇指')
    document.querySelector('.wallpaper-body').textContent.should.equal('Touch thumb to each fingertip one by one, then reverse the order.')

    global.document = previousDocument
    global.window = previousWindow
  })

  it('selects a lock-screen depth poster for strong foreground natural scenes', () => {
    const composition = scoreAndSelectLayout(generatePosterLayoutCandidates({
      displayTitle: 'Peace',
      instruction: 'Take one slow breath.',
      category: 'grass field / horizon',
      credit: 'Stretchly',
      isCjk: false,
      isShortWord: true,
      isShortCjk: false,
      length: 5
    }, analysisFixture({
      lowDetailCandidateRegions: [{
        x: 0.18,
        y: 0.18,
        width: 0.56,
        height: 0.28,
        area: 54,
        avgBrightness: 174,
        avgTexture: 0.14,
        centerX: 0.48,
        centerY: 0.34
      }],
      openAreaRatio: 0.34,
      skyOrOpenAreaEstimate: 0.24,
      horizonEstimate: { y: 0.5, confidence: 0.42 },
      foregroundDensityEstimate: 0.46,
      avgDetail: 0.26,
      subject: 'subject-plant'
    }), undefined, 'depth-field-test'), analysisFixture({
      openAreaRatio: 0.34,
      skyOrOpenAreaEstimate: 0.24,
      horizonEstimate: { y: 0.5, confidence: 0.42 },
      foregroundDensityEstimate: 0.46,
      avgDetail: 0.26,
      subject: 'subject-plant'
    }), {
      displayTitle: 'Peace',
      instruction: 'Take one slow breath.',
      isCjk: false,
      isShortWord: true,
      isShortCjk: false,
      length: 5
    })

    composition.layoutClass.should.equal('poster-depth-lockscreen-poster')
    composition.depthClass.should.equal('poster-depth-lockscreen')
    composition.palette['--poster-depth-start'].should.match(/%$/)
    composition.palette['--poster-depth-title-size'].should.match(/px$/)
  })

  it('keeps the save button in the saved state until the wallpaper changes', async () => {
    const dom = new JSDOM(`<!doctype html><html><body>
      <div class="breaks">
        <div>
          <div class="wallpaper-theme" aria-hidden="true">
            <img class="wallpaper-image" alt="">
            <img class="wallpaper-depth-image" alt="" aria-hidden="true">
            <div class="wallpaper-generated"></div>
            <div class="wallpaper-top-meta" aria-hidden="true">
              <div class="wallpaper-label"></div>
              <div class="wallpaper-mood"></div>
              <div class="wallpaper-meta"></div>
            </div>
            <div class="wallpaper-text">
              <div class="wallpaper-title"></div>
              <div class="wallpaper-body"></div>
            </div>
          </div>
        </div>
        <div></div>
      </div>
    </body></html>`)
    const previousDocument = global.document
    const previousWindow = global.window
    global.document = dom.window.document
    global.window = dom.window
    window.i18next = {
      t: async key => ({
        'break.saveImage': 'Save image',
        'break.savedImage': 'Saved',
        'break.saveImageFailed': 'Save failed',
        'break.dislikeImage': 'Dislike image'
      })[key] || key
    }
    window.electronApi = {
      saveCurrentWallpaper: async () => '/tmp/saved.jpg'
    }

    await applyWallpaperTheme({
      ideaTitle: 'Look away',
      ideaText: 'Rest your eyes.',
      options: {
        theme: 'wallpaper',
        wallpaper: {
          id: 'first-wallpaper',
          keyword: 'misty forest',
          fileUrl: 'file:///tmp/first.jpg',
          canSave: true,
          context: { timeOfDay: 'morning' }
        }
      },
      sanitizer: value => value
    })

    const button = document.querySelector('#save-wallpaper')
    button.parentElement.should.equal(document.body)
    button.textContent.should.contain('Save image')
    await button.onclick()
    button.disabled.should.equal(true)
    button.classList.contains('is-saved').should.equal(true)
    button.textContent.should.contain('Saved')

    await applyWallpaperTheme({
      ideaTitle: 'Look away',
      ideaText: 'Rest your eyes.',
      options: {
        theme: 'wallpaper',
        wallpaper: {
          id: 'second-wallpaper',
          keyword: 'quiet lake',
          fileUrl: 'file:///tmp/second.jpg',
          canSave: true,
          context: { timeOfDay: 'evening' }
        }
      },
      sanitizer: value => value
    })

    button.disabled.should.equal(false)
    button.classList.contains('is-saved').should.equal(false)
    button.textContent.should.contain('Save image')

    global.document = previousDocument
    global.window = previousWindow
  })
})
