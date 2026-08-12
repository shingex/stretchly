import gsap from '../../node_modules/gsap/index.js'

const headlinePool = [
  'Borrow The Horizon',
  'Let The Room Breathe',
  'Look Past The Glass',
  'A Softer Distance',
  'Leave A Little Sky',
  'Return To Quiet',
  'The Day Opens',
  'Slow Weather',
  'Field Notes For Rest',
  'Another Rhythm',
  'Follow The Light',
  'Pause In Full Frame'
]

function kebabCase (value) {
  return String(value || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

const screenUISafeZones = {
  bottom: { x: 0, y: 0.82, width: 1, height: 0.18 },
  topRight: { x: 0.9, y: 0, width: 0.1, height: 0.12 },
  edgePadding: 0.05
}
const posterLayoutTypes = [
  'HeroSkyCenter',
  'HorizonOverlay',
  'LandscapeEditorial',
  'DepthLockscreenPoster',
  'CalmInstructionPoster',
  'MinimalPhrase',
  'FullTypographicPoster'
]
const posterLayoutClasses = [
  'poster-layout',
  'poster-centered-simple',
  ...posterLayoutTypes.map(type => `poster-${kebabCase(type)}`),
  'poster-anchor-left',
  'poster-anchor-right',
  'poster-anchor-center'
]
const posterSchemeClasses = [
  'poster-scheme-sky',
  'poster-scheme-horizon',
  'poster-scheme-editorial',
  'poster-scheme-depth',
  'poster-scheme-calm',
  'poster-scheme-minimal',
  'poster-scheme-full'
]
const secondaryInfoSlots = {
  nearTitleSmall: { name: 'nearTitleSmall', role: 'instruction', relative: true },
  upperEdgeSubtle: { name: 'upperEdgeSubtle', x: 0.08, y: 0.12, width: 0.22, height: 0.04, anchor: 'left' },
  lowerEdgeSubtle: { name: 'lowerEdgeSubtle', x: 0.08, y: 0.74, width: 0.26, height: 0.04, anchor: 'left' },
  sideMetadata: { name: 'sideMetadata', x: 0.78, y: 0.46, width: 0.16, height: 0.08, anchor: 'right' },
  quietCorner: { name: 'quietCorner', x: 0.07, y: 0.08, width: 0.2, height: 0.04, anchor: 'left' }
}
const cjkProtectedTerms = [
  '注意力',
  '眼睛',
  '肩颈',
  '手腕',
  '腰背',
  '坐姿',
  '呼吸',
  '脖子',
  '肩膀',
  '手臂',
  '双脚',
  '臀部',
  '椅背',
  '放松',
  '休息',
  '转动',
  '拉伸',
  '重置',
  '检查',
  '闭眼'
]
const legacyLayoutClasses = [
  'layout-left',
  'layout-right',
  'layout-center',
  'layout-top',
  'layout-bottom',
  'layout-magazine-cover',
  'layout-poster-stack',
  'layout-side-note',
  'layout-field-card',
  'layout-caption-strip',
  'layout-upper-left',
  'layout-upper-right',
  'layout-mid-left',
  'layout-mid-right',
  'layout-sky-left',
  'layout-sky-right',
  'layout-low-left',
  'layout-low-right'
]

function textFromIdea (value, sanitizer) {
  const tmp = document.createElement('div')
  tmp.innerHTML = sanitizer(value || '')
  return tmp.textContent.replace(/\s+/g, ' ').trim()
}

function normalizeText (text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '')
}

function isDuplicateText (a, b) {
  const left = normalizeText(a)
  const right = normalizeText(b)
  if (!left || !right) return false
  if (left === right) return true
  return left.length > 10 && right.length > 10 && (left.includes(right) || right.includes(left))
}

function titleFromWallpaper (wallpaper) {
  const contextual = {
    morning: ['First Light, Slow Breath', 'Morning Distance', 'A Softer Start'],
    afternoon: ['Wide Afternoon', 'Slow Weather', 'Look Farther'],
    evening: ['Evening Margin', 'The Day Loosens', 'Low Light, Open Window'],
    night: ['Night Window', 'Quiet Orbit', 'Dim The Room']
  }
  const pool = contextual[wallpaper?.context?.timeOfDay] || headlinePool
  return pool[Math.floor(Math.random() * pool.length)]
}

function supportFromText (text, title) {
  const cleaned = String(text || '').trim()
  if (!cleaned || isDuplicateText(cleaned, title)) return ''
  const sentences = cleaned.split(/(?<=[.!?。！？])\s+/).filter(Boolean)
  const support = sentences[0] || cleaned
  return support.length > 96 ? `${support.slice(0, 93).trim()}...` : support
}

function posterDisplayTitle (title, instruction = '') {
  const normalized = String(title || '').replace(/\s+/g, '').trim()
  const functionalMap = new Map([
    ['检查注意力', '回到此刻'],
    ['横向拉肩', '松开肩颈'],
    ['轻轻点头', '慢慢放松'],
    ['深呼吸', '慢慢呼吸'],
    ['闭眼休息', '安静片刻'],
    ['放松眼睛', '望向远处']
  ])
  if (functionalMap.has(normalized)) return functionalMap.get(normalized)
  const text = String(title || instruction || '').trim()
  if (!text) return 'Pause'
  return text
}

function buildPosterCopy ({ ideaTitle, ideaText, wallpaper, sanitizer }) {
  const bodyText = textFromIdea(ideaText, sanitizer)
  const ideaTitleText = textFromIdea(ideaTitle, sanitizer)
  const instruction = supportFromText(bodyText, ideaTitleText)
  const displayTitle = posterDisplayTitle(ideaTitleText || titleFromWallpaper(wallpaper), instruction)
  return {
    label: labelForWallpaper(wallpaper),
    title: displayTitle,
    support: instruction,
    meta: metaForWallpaper(wallpaper),
    displayTitle,
    instruction,
    subtitle: '',
    credit: metaForWallpaper(wallpaper),
    category: labelForWallpaper(wallpaper)
  }
}

function normalizePosterCopy (copy = {}) {
  const displayTitle = posterDisplayTitle(copy.displayTitle || copy.title, copy.instruction || copy.support)
  const instruction = copy.instruction || copy.support || ''
  return {
    ...copy,
    label: copy.label || copy.category || '',
    title: displayTitle,
    support: instruction,
    meta: copy.meta || copy.credit || '',
    displayTitle,
    instruction,
    subtitle: copy.subtitle || '',
    credit: copy.credit || copy.meta || '',
    category: copy.category || copy.label || ''
  }
}

const wallpaperLayoutClasses = [...legacyLayoutClasses, ...posterLayoutClasses]
const wallpaperToneClasses = ['tone-ink', 'tone-paper']
const wallpaperTypographyClasses = [
  'typography-modern',
  'typography-serif',
  'typography-quiet',
  'typography-editorial',
  'typography-caption'
]
const wallpaperSubjectClasses = [
  'subject-people',
  'subject-architecture',
  'subject-landscape',
  'subject-plant',
  'subject-object',
  'subject-city',
  'subject-interior',
  'subject-texture'
]
const wallpaperFocusClasses = [
  'focus-left',
  'focus-right',
  'focus-center',
  'focus-top',
  'focus-bottom'
]
const wallpaperSchemeClasses = ['scheme-a', 'scheme-b', 'scheme-c', 'scheme-d', 'scheme-e', 'scheme-f', ...posterSchemeClasses]
const wallpaperDecorClasses = ['decor-none', 'decor-line', 'decor-shade', 'needs-readable-shade']
const wallpaperDepthClasses = ['poster-depth-lockscreen']
const wallpaperPaletteProperties = [
  '--wallpaper-accent',
  '--wallpaper-ink',
  '--wallpaper-muted',
  '--wallpaper-paper',
  '--wallpaper-rule',
  '--wallpaper-shadow',
  '--poster-x',
  '--poster-y',
  '--poster-max-width',
  '--poster-title-size',
  '--poster-line-height',
  '--poster-letter-spacing',
  '--poster-subtitle-size',
  '--poster-metadata-size',
  '--poster-metadata-opacity',
  '--poster-metadata-max-width',
  '--poster-scrim-opacity',
  '--poster-title-opacity',
  '--poster-instruction-opacity',
  '--poster-metadata-opacity',
  '--poster-instruction-color',
  '--poster-metadata-color',
  '--poster-depth-start',
  '--poster-depth-softness'
]
const wallpaperEntranceVariants = ['drift', 'fade', 'breathe']
const wallpaperMotionSelectors = [
  '.wallpaper-motion-sweep',
  '.wallpaper-motion-focus'
]
let wallpaperEntranceTimeout = null

async function applyWallpaperTheme ({ ideaTitle, ideaText, options, sanitizer, animate = true, prepareText = false }) {
  if (options?.theme !== 'wallpaper') return

  document.body.classList.add('wallpaper-break')

  const theme = document.querySelector('.wallpaper-theme')
  const image = document.querySelector('.wallpaper-image')
  const depthImage = document.querySelector('.wallpaper-depth-image')
  const generated = document.querySelector('.wallpaper-generated')
  const label = document.querySelector('.wallpaper-label')
  const mood = document.querySelector('.wallpaper-mood')
  const title = document.querySelector('.wallpaper-title')
  const body = document.querySelector('.wallpaper-body')
  const meta = document.querySelector('.wallpaper-meta')
  if (!theme || !image || !depthImage || !generated || !label || !mood || !title || !body || !meta) return

  await renderWallpaper({
    theme,
    image,
    depthImage,
    generated,
    label,
    mood,
    title,
    body,
    meta,
    ideaTitle,
    ideaText,
    wallpaper: options.wallpaper || {},
    wallpaperText: options.wallpaperText,
    wallpaperAnimationVariant: options.wallpaperAnimationVariant,
    sanitizer,
    animate,
    prepareText
  })
  await appendSaveControl(options.wallpaper || {})
  await appendDislikeControl({
    ideaTitle,
    ideaText,
    sanitizer,
    elements: { theme, image, depthImage, generated, label, mood, title, body, meta }
  })
}

async function renderWallpaper ({ theme, image, depthImage, generated, label, mood, title, body, meta, ideaTitle, ideaText, wallpaper, wallpaperText, wallpaperAnimationVariant, sanitizer, animate = true, prepareText = false }) {
  resetWallpaperTheme(theme, image, depthImage)

  const copy = normalizePosterCopy(wallpaperText || buildPosterCopy({ ideaTitle, ideaText, wallpaper, sanitizer }))
  const composition = centeredPosterComposition(copy, wallpaper)
  const metadata = posterTopMetadata(copy)
  label.textContent = metadata.left
  mood.textContent = metadata.center
  title.textContent = ''
  body.textContent = ''
  meta.textContent = metadata.source
  label.hidden = !label.textContent
  mood.hidden = !mood.textContent
  body.hidden = !composition.showInstruction
  meta.hidden = !meta.textContent

  if (wallpaper.fileUrl) {
    image.src = wallpaper.fileUrl
    image.style.objectPosition = wallpaper.position || 'center 50%'
    generated.style.setProperty('--wallpaper-color-a', wallpaper.colorA || '#c8d9cf')
    generated.style.setProperty('--wallpaper-color-b', wallpaper.colorB || '#e9d0aa')
    generated.style.setProperty('--wallpaper-color-c', wallpaper.colorC || '#334b45')
    try {
      await image.decode()
      theme.classList.add('has-image')
    } catch (_) {
      theme.classList.remove('has-image')
    }
  } else {
    generated.style.setProperty('--wallpaper-color-a', wallpaper.colorA || '#c8d9cf')
    generated.style.setProperty('--wallpaper-color-b', wallpaper.colorB || '#e9d0aa')
    generated.style.setProperty('--wallpaper-color-c', wallpaper.colorC || '#334b45')
  }
  applyWallpaperComposition(theme, composition)
  body.textContent = composition.showInstruction ? copy.instruction || copy.support || '' : ''
  body.hidden = !body.textContent
  label.hidden = !label.textContent
  mood.hidden = !mood.textContent
  meta.hidden = !meta.textContent
  renderWallpaperTitle(title, copy.displayTitle || copy.title, composition.poster, copy)
  await updateSaveControlVisibility(wallpaper)
  if (prepareText) prepareWallpaperText()
  if (animate) animateWallpaperText({ variant: wallpaperAnimationVariant })
}

function prepareWallpaperText () {
  const nodes = visibleWallpaperTextNodes(wallpaperAnimationElements().text)
  if (!nodes.length) return
  stopWallpaperTextAnimation()
  nodes.forEach(node => node.setAttribute('data-text-entrance', 'true'))
  gsap.set(nodes, { autoAlpha: 0 })
}

function animateWallpaperText (options = {}) {
  const elements = wallpaperAnimationElements()
  const nodes = visibleWallpaperTextNodes(elements.text)
  if (!nodes.length) return null

  stopWallpaperTextAnimation()
  nodes.forEach(node => node.setAttribute('data-text-entrance', 'true'))

  if (prefersReducedMotion()) {
    gsap.set(nodes, { autoAlpha: 1, clearProps: 'transform,filter,visibility' })
    return null
  }

  const variant = options.variant || selectWallpaperEntranceVariant()
  const delayMs = options.scheduled ? options.delayMs ?? 2000 : options.delayMs ?? 0
  const start = () => runWallpaperEntrance(elements, nodes, variant, options)

  prepareWallpaperEntrance(elements, nodes)
  if (delayMs <= 0) return start()

  wallpaperEntranceTimeout = window.setTimeout(() => {
    wallpaperEntranceTimeout = null
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(start)
      })
    } else {
      start()
    }
  }, delayMs)
}

function selectWallpaperEntranceVariant () {
  return wallpaperEntranceVariants[Math.floor(Math.random() * wallpaperEntranceVariants.length)]
}

function wallpaperAnimationElements () {
  const theme = document.querySelector('.wallpaper-theme')
  const title = document.querySelector('.wallpaper-title')
  const body = document.querySelector('.wallpaper-body')
  return {
    theme,
    image: document.querySelector('.wallpaper-image'),
    depthImage: document.querySelector('.wallpaper-depth-image'),
    generated: document.querySelector('.wallpaper-generated'),
    textWrap: document.querySelector('.wallpaper-text') || document.querySelector('.wallpaper-label')?.parentElement,
    sweep: ensureWallpaperMotionElement(theme, 'wallpaper-motion-sweep'),
    focus: ensureWallpaperMotionElement(theme, 'wallpaper-motion-focus'),
    text: [
      title,
      body
    ],
    title,
    body
  }
}

function ensureWallpaperMotionElement (theme, className) {
  if (!theme) return null
  const existing = theme.querySelector(`.${className}`)
  if (existing) return existing
  const element = document.createElement('div')
  element.className = className
  element.setAttribute('aria-hidden', 'true')
  theme.appendChild(element)
  return element
}

function visibleWallpaperTextNodes (elements) {
  return elements.filter(element => element && !element.hidden && element.textContent.trim())
}

function prefersReducedMotion () {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function stopWallpaperTextAnimation () {
  const animated = document.querySelectorAll('[data-text-entrance]')
  const titleWords = document.querySelectorAll('.wallpaper-title-word')
  const motion = wallpaperMotionSelectors
    .flatMap(selector => [...document.querySelectorAll(selector)])
  const media = [
    document.querySelector('.wallpaper-image'),
    document.querySelector('.wallpaper-generated'),
    document.querySelector('.wallpaper-text')
  ].filter(Boolean)

  if (wallpaperEntranceTimeout) {
    window.clearTimeout(wallpaperEntranceTimeout)
    wallpaperEntranceTimeout = null
  }
  gsap.killTweensOf([...animated, ...titleWords, ...motion, ...media])
  animated.forEach(element => {
    gsap.set(element, { clearProps: 'transform,filter,opacity,visibility' })
    element.removeAttribute('data-text-entrance')
  })
  motion.forEach(element => {
    gsap.set(element, { autoAlpha: 0, clearProps: 'transform,filter' })
  })
  media.forEach(element => {
    gsap.set(element, { clearProps: 'transform,filter,opacity,visibility' })
  })
}

function prepareWallpaperEntrance (elements, nodes) {
  gsap.set(nodes, { autoAlpha: 0 })
  gsap.set([elements.sweep, elements.focus].filter(Boolean), { autoAlpha: 0 })
  gsap.set([elements.image, elements.generated, elements.textWrap].filter(Boolean), {
    clearProps: 'transform,filter,opacity,visibility'
  })
}

function runWallpaperEntrance (elements, nodes, variant, options = {}) {
  const timeline = gsap.timeline()
  const media = elements.image?.getAttribute('src') ? elements.image : elements.generated
  const titleNode = elements.title || document.querySelector('.wallpaper-title')
  const titleWords = titleNode ? [...titleNode.querySelectorAll('.wallpaper-title-word')] : []

  const baseText = (textOptions = {}) => {
    const at = textOptions.at ?? 0.12
    timeline.fromTo(nodes, {
      autoAlpha: 0,
      y: textOptions.offsetY ?? options.offsetY ?? 12,
      x: textOptions.offsetX ?? 0,
      filter: `blur(${textOptions.blur ?? 5}px)`
    }, {
      autoAlpha: 1,
      y: 0,
      x: 0,
      filter: 'blur(0px)',
      duration: textOptions.duration ?? 1.05,
      ease: textOptions.ease ?? 'power2.out',
      stagger: textOptions.stagger ?? options.stagger ?? 0.045
    }, at)

    if (titleWords.length > 1) {
      timeline.fromTo(titleWords, {
        autoAlpha: 0,
        y: '0.12em',
        filter: 'blur(4px)'
      }, {
        autoAlpha: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: textOptions.wordDuration ?? 0.72,
        ease: textOptions.wordEase ?? 'power2.out',
        stagger: textOptions.wordStagger ?? 0.026
      }, at + 0.08)
    }
  }

  if (variant === 'drift') {
    timeline.fromTo(media, {
      scale: 1.025,
      xPercent: 0.8,
      filter: 'saturate(0.92) contrast(0.97)'
    }, {
      scale: 1.006,
      xPercent: 0,
      filter: 'saturate(0.98) contrast(0.99)',
      duration: 1.35,
      ease: 'sine.out'
    }, 0)
    baseText({ offsetX: -8, offsetY: 8, blur: 4, at: 0.22 })
    timeline.to(media, {
      xPercent: -1.2,
      scale: 1.018,
      duration: options.loopDuration ?? 9.5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true
    }, '+=0.4')
    return timeline
  }

  if (variant === 'breathe') {
    timeline.fromTo(media, {
      scale: 1.018,
      filter: 'saturate(0.9) contrast(0.96)'
    }, {
      scale: 1.002,
      filter: 'saturate(0.98) contrast(0.99)',
      duration: 1.4,
      ease: 'sine.out'
    }, 0)
      .fromTo(elements.focus, {
        autoAlpha: 0.2,
        scale: 1.06
      }, {
        autoAlpha: 0.08,
        scale: 1,
        duration: 1.4,
        ease: 'sine.out'
      }, 0)
    baseText({ offsetY: 10, blur: 4, stagger: options.stagger ?? 0.06, at: 0.18 })
    timeline.to(media, {
      scale: 1.014,
      duration: options.loopDuration ?? 7.2,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true
    }, '+=0.35')
    return timeline
  }

  timeline.fromTo(media, {
    scale: 1.012,
    filter: 'saturate(0.94) contrast(0.98)'
  }, {
    scale: 1,
    filter: 'saturate(0.98) contrast(0.99)',
    duration: 1.2,
    ease: 'sine.out'
  }, 0)
  baseText({ offsetY: 8, blur: 4, stagger: options.stagger ?? 0.05, at: 0.18 })
  return timeline
}

function resetWallpaperTheme (theme, image, depthImage) {
  theme.classList.remove(
    'has-image',
    ...wallpaperLayoutClasses,
    ...wallpaperToneClasses,
    ...wallpaperTypographyClasses,
    ...wallpaperSubjectClasses,
    ...wallpaperFocusClasses,
    ...wallpaperSchemeClasses,
    ...wallpaperDecorClasses,
    ...wallpaperDepthClasses
  )
  wallpaperPaletteProperties.forEach(property => theme.style.removeProperty(property))
  image.removeAttribute('src')
  image.style.objectPosition = ''
  if (depthImage) {
    depthImage.removeAttribute('src')
    depthImage.style.objectPosition = ''
  }
}

function centeredPosterComposition (copy = {}, wallpaper = {}) {
  const titleText = String(copy.displayTitle || copy.title || '').trim()
  const secondaryTitle = centeredPosterSecondaryTitle(copy).toUpperCase()
  const sizes = centeredPosterTextSizes(titleText, secondaryTitle, copy.instruction || copy.support || '')
  const subject = subjectFromWallpaper(wallpaper, profileFromWallpaperColors(wallpaper))
  return {
    layout: 'poster-layout',
    layoutClass: 'poster-centered-simple',
    anchorClass: 'poster-anchor-center',
    tone: 'tone-paper',
    typography: 'typography-modern',
    subject,
    focus: 'focus-center',
    scheme: 'poster-scheme-minimal',
    decor: 'decor-none',
    readableShade: false,
    palette: {
      '--wallpaper-paper': '#ffffff',
      '--wallpaper-ink': '#101820',
      '--wallpaper-muted': 'rgba(255, 255, 255, 0.86)',
      '--wallpaper-rule': 'rgba(255, 255, 255, 0)',
      '--wallpaper-shadow': 'rgba(0, 0, 0, 0.24)',
      '--center-title-primary-size': `${sizes.primary}px`,
      '--center-title-secondary-size': `${sizes.secondary}px`,
      '--center-description-size': `${sizes.description}px`
    },
    poster: {
      maxLines: 1,
      secondaryTitle,
      sizes
    },
    showInstruction: Boolean(copy.instruction || copy.support)
  }
}

function centeredPosterSecondaryTitle (copy = {}) {
  const title = String(copy.displayTitle || copy.title || '').trim()
  if (!/[\u4e00-\u9fff]/.test(title)) return ''
  const explicit = copy.secondaryTitle || copy.translationTitle || copy.subtitle
  if (explicit && !isDuplicateText(explicit, title)) return String(explicit).trim()
  return ''
}

function posterTopMetadata (copy = {}) {
  const category = String(copy.category || copy.label || '').trim()
  const mood = String(copy.mood || '').trim()
  const credit = String(copy.credit || copy.meta || '').trim()
  const categoryParts = category.split(/\s*\/\s*/).filter(Boolean)
  return {
    left: categoryParts[0] || category,
    center: mood || categoryParts.slice(1).join(' / '),
    source: credit
  }
}

function centeredPosterTextSizes (primary, secondary, description) {
  const width = typeof window !== 'undefined' ? Math.max(window.innerWidth || 0, 960) : 1440
  const maxWidth = width * 0.9
  const primarySize = fitSingleLineFontSize(primary, maxWidth, secondary ? 148 : 176, 54)
  const secondarySize = secondary
    ? fitSingleLineFontSize(secondary, maxWidth, 132, 42)
    : Math.round(primarySize * 0.82)
  const descriptionSize = fitSingleLineFontSize(description, maxWidth * 0.78, 34, 18)
  return {
    primary: primarySize,
    secondary: secondarySize,
    description: descriptionSize
  }
}

function fitSingleLineFontSize (text, maxWidth, preferred, min) {
  const weight = visualTextWeight(text)
  if (!weight) return preferred
  const fitted = Math.floor(maxWidth / weight)
  return clamp(Math.min(preferred, fitted), min, preferred)
}

function visualTextWeight (text) {
  return [...String(text || '').trim()].reduce((sum, char) => {
    if (/[\u4e00-\u9fff]/.test(char)) return sum + 1.05
    if (/\s/.test(char)) return sum + 0.34
    if (/[A-Z]/.test(char)) return sum + 0.68
    return sum + 0.58
  }, 0)
}

function renderWallpaperTitle (title, text, poster = {}, copy = {}) {
  if (poster.maxLines === 1) {
    const primary = String(text || '').trim()
    const secondary = poster.secondaryTitle || centeredPosterSecondaryTitle(copy)
    title.classList.toggle('is-single-title', !secondary)
    appendCenteredTitleLine(title, primary, 'wallpaper-title-primary')
    if (secondary) appendCenteredTitleLine(title, secondary.toUpperCase(), 'wallpaper-title-secondary')
    title.style.setProperty('--poster-title-lines', secondary ? '2' : '1')
    return
  }

  const content = String(text || '').trim()
  const isCjk = /[\u4e00-\u9fff]/.test(content)
  const lines = isCjk
    ? poster.titleLines?.length ? poster.titleLines : cjkSemanticTitleLines(content, poster.maxLines || 2)
    : [content]
  lines.forEach((line, lineIndex) => {
    if (isCjk) {
      if (lineIndex > 0) title.appendChild(document.createElement('br'))
      const span = document.createElement('span')
      span.className = 'wallpaper-title-line'
      span.textContent = line
      title.appendChild(span)
      return
    }
    line.split(/\s+/).filter(Boolean).forEach((part, wordIndex) => {
      if (lineIndex > 0 || wordIndex > 0) title.appendChild(document.createTextNode(' '))
      const span = document.createElement('span')
      span.className = 'wallpaper-title-word'
      span.textContent = part
      title.appendChild(span)
    })
  })
  title.style.setProperty('--poster-title-lines', String(lines.length || 1))
}

function appendCenteredTitleLine (title, text, className) {
  const line = document.createElement('span')
  line.className = `${className} wallpaper-title-word`
  line.textContent = text
  title.appendChild(line)
}

function labelForWallpaper (wallpaper) {
  const keyword = wallpaper.keyword?.replace(/\s+no people$/i, '')
  const time = wallpaper.context?.timeOfDay
  const weather = wallpaper.context?.weatherMood
  return [keyword || 'pause study', time, weather].filter(Boolean).join(' / ')
}

function metaForWallpaper (wallpaper) {
  const parts = []
  if (wallpaper.sourceName && wallpaper.sourceName !== 'Stretchly') parts.push(wallpaper.sourceName)
  if (wallpaper.authorName) parts.push(wallpaper.authorName)
  return parts.join(' - ')
}

async function appendSaveControl (wallpaper) {
  const existing = document.querySelector('#save-wallpaper')
  if (existing) {
    if (existing.parentElement !== document.body) document.body.appendChild(existing)
    await updateSaveControlVisibility(wallpaper)
    return
  }
  const saveText = await window.i18next.t('break.saveImage')
  const button = document.createElement('button')
  button.id = 'save-wallpaper'
  button.className = 'wallpaper-save'
  button.type = 'button'
  const label = document.createElement('span')
  const icon = document.createElement('img')
  label.textContent = saveText
  icon.src = 'images/breaks/break-download.svg'
  icon.alt = ''
  icon.setAttribute('aria-hidden', 'true')
  button.append(label, icon)
  document.body.appendChild(button)
  await updateSaveControlVisibility(wallpaper)
}

async function updateSaveControlVisibility (wallpaper) {
  const button = document.querySelector('#save-wallpaper')
  if (!button) return
  const label = button.querySelector('span')
  const saveText = await window.i18next.t('break.saveImage')
  const savedText = await window.i18next.t('break.savedImage')
  const failedText = await window.i18next.t('break.saveImageFailed')
  button.hidden = !wallpaper.canSave
  if (!wallpaper.canSave) return

  const currentWallpaperId = wallpaper.id || ''
  const isSaved = button.dataset.savedWallpaperId === currentWallpaperId
  button.disabled = isSaved
  button.classList.toggle('is-saved', isSaved)
  if (label) label.textContent = isSaved ? savedText : saveText
  button.onclick = async () => {
    if (button.disabled) return
    button.disabled = true
    const savedPath = await window.electronApi.saveCurrentWallpaper()
    if (savedPath) {
      button.dataset.savedWallpaperId = currentWallpaperId
      button.classList.add('is-saved')
      if (label) label.textContent = savedText
    } else {
      button.disabled = false
      if (label) label.textContent = failedText
      setTimeout(() => {
        if (button.dataset.savedWallpaperId === currentWallpaperId) return
        if (label) label.textContent = saveText
      }, 1800)
    }
  }
}

async function appendDislikeControl ({ ideaTitle, ideaText, sanitizer, elements }) {
  if (document.querySelector('#dislike-wallpaper')) return
  const button = document.createElement('button')
  button.id = 'dislike-wallpaper'
  button.className = 'wallpaper-dislike'
  button.type = 'button'
  button.title = await window.i18next.t('break.dislikeImage')
  button.setAttribute('aria-label', button.title)
  button.innerHTML = `
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M4.2 6.1c0-1 .8-1.8 1.8-1.8h8c1 0 1.8.8 1.8 1.8v7.8c0 1-.8 1.8-1.8 1.8H6c-1 0-1.8-.8-1.8-1.8V6.1z"/>
      <path d="M6.6 12.8l2.3-2.6 1.8 1.9 1.1-1.2 1.7 1.9"/>
      <path d="M6.3 6.1l7.4 7.8"/>
    </svg>`

  button.onclick = async () => {
    button.disabled = true
    const options = await window.electronApi.dislikeCurrentWallpaper()
    if (options) {
      const wallpaper = options.wallpaper || options
      await renderWallpaper({
        ...elements,
        ideaTitle,
        ideaText,
        wallpaper,
        wallpaperText: options.wallpaperText,
        wallpaperAnimationVariant: options.wallpaperAnimationVariant,
        sanitizer
      })
    }
    button.disabled = false
  }

  document.body.appendChild(button)
}

function analyzeImageForTypography ({ data, width, height, wallpaper = {}, palette = [], subjectAvoidanceRegions = [] }) {
  const cells = []
  const brightnessMap = []
  const detailMap = []
  const textureDensityMap = []
  const saturationMap = []
  let red = 0
  let green = 0
  let blue = 0
  let brightnessTotal = 0
  let detailTotal = 0
  let foregroundDensity = 0
  for (let y = 0; y < height; y++) {
    brightnessMap[y] = []
    detailMap[y] = []
    textureDensityMap[y] = []
    saturationMap[y] = []
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4
      const r = data[index]
      const g = data[index + 1]
      const b = data[index + 2]
      const hsl = rgbToHsl(r, g, b)
      const brightness = luminance(r, g, b)
      const left = x > 0 ? luminance(data[index - 4], data[index - 3], data[index - 2]) : brightness
      const topIndex = index - width * 4
      const top = y > 0 ? luminance(data[topIndex], data[topIndex + 1], data[topIndex + 2]) : brightness
      const detail = clamp((Math.abs(brightness - left) + Math.abs(brightness - top)) / 255, 0, 1)
      const textureDensity = clamp(detail * 0.72 + hsl.s * 0.28, 0, 1)
      const cell = {
        x,
        y,
        brightness,
        contrast: detail,
        edgeStrength: detail,
        saturation: hsl.s,
        textureDensity,
        safe: isTypographyCellSafe(x, y, width, height)
      }
      brightnessMap[y][x] = brightness
      detailMap[y][x] = detail
      textureDensityMap[y][x] = textureDensity
      saturationMap[y][x] = hsl.s
      cells.push(cell)
      red += r
      green += g
      blue += b
      brightnessTotal += brightness
      detailTotal += detail
      if (y > height * 0.55 && textureDensity > 0.18) foregroundDensity += textureDensity
    }
  }

  const dominantRgb = palette[0] || { r: red / cells.length, g: green / cells.length, b: blue / cells.length }
  const dominant = rgbToHsl(dominantRgb.r, dominantRgb.g, dominantRgb.b)
  const avgBrightness = brightnessTotal / cells.length
  const avgDetail = detailTotal / cells.length
  const smartcropRegions = subjectAvoidanceRegions.map(region => ({
    ...region,
    avgSalience: region.weight || 1,
    area: Math.max(region.width * region.height * width * height, 1)
  }))
  const lowDetailCandidateRegions = findLowDetailCandidateRegions(cells, width, height, smartcropRegions)
  const salientRegions = findSalientRegions(cells, width, height)
  const horizonEstimate = estimateHorizon(brightnessMap, saturationMap, width, height)
  const topOpen = cells.filter(cell => cell.safe && cell.y < height * 0.45 && cell.textureDensity < 0.16).length
  const bottomOpen = cells.filter(cell => cell.safe && cell.y >= height * 0.45 && cell.textureDensity < 0.16).length
  const safeCount = cells.filter(cell => cell.safe).length || 1
  const openAreaRatio = lowDetailCandidateRegions.reduce((sum, region) => sum + region.area, 0) / safeCount
  const subject = subjectFromWallpaper(wallpaper, {
    edgeAverage: avgDetail,
    avg: avgBrightness,
    saturation: dominant.s
  })
  const recommendedMood = recommendedMoodForImage(subject, {
    avg: avgBrightness,
    detail: avgDetail,
    topOpen,
    bottomOpen
  })

  return {
    brightnessMap,
    contrastMap: detailMap,
    detailMap,
    edgeDensityMap: detailMap,
    textureDensityMap,
    palette: paletteFromColors(palette, dominant, avgBrightness),
    dominantColors: palette,
    dominantPalette: paletteFromColors(palette, dominant, avgBrightness),
    lowDetailCandidateRegions,
    subjectAvoidanceRegions: [...smartcropRegions, ...salientRegions],
    salientRegions: [...smartcropRegions, ...salientRegions],
    openAreaRatio,
    horizonEstimate,
    skyOrOpenAreaEstimate: topOpen / safeCount,
    foregroundDensityEstimate: foregroundDensity / safeCount,
    recommendedMood,
    safeZones: screenUISafeZones,
    cells,
    width,
    height,
    avgBrightness,
    avgDetail,
    subject,
    hue: dominant.h,
    saturation: dominant.s
  }
}

function findSalientRegions (cells, width, height) {
  const regions = []
  const visited = new Set()
  const eligible = cell => cell.safe && (cell.textureDensity > 0.34 || cell.edgeStrength > 0.28 || cell.saturation > 0.42)
  for (const cell of cells) {
    const key = `${cell.x}:${cell.y}`
    if (visited.has(key) || !eligible(cell)) continue
    const queue = [cell]
    const members = []
    visited.add(key)
    while (queue.length) {
      const current = queue.shift()
      members.push(current)
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = current.x + dx
        const ny = current.y + dy
        const nextKey = `${nx}:${ny}`
        if (nx < 0 || ny < 0 || nx >= width || ny >= height || visited.has(nextKey)) continue
        const next = cells[ny * width + nx]
        if (!eligible(next)) continue
        visited.add(nextKey)
        queue.push(next)
      }
    }
    if (members.length < 2) continue
    const xs = members.map(member => member.x)
    const ys = members.map(member => member.y)
    const avgSalience = members.reduce((sum, member) => sum + member.textureDensity + member.edgeStrength + member.saturation * 0.35, 0) / members.length
    const region = {
      x: Math.min(...xs) / width,
      y: Math.min(...ys) / height,
      width: (Math.max(...xs) - Math.min(...xs) + 1) / width,
      height: (Math.max(...ys) - Math.min(...ys) + 1) / height,
      area: members.length,
      avgSalience
    }
    regions.push(region)
  }
  return regions.sort((a, b) => (b.avgSalience * b.area) - (a.avgSalience * a.area)).slice(0, 5)
}

function isTypographyCellSafe (x, y, width, height) {
  const nx = (x + 0.5) / width
  const ny = (y + 0.5) / height
  const edge = screenUISafeZones.edgePadding
  if (nx < edge || nx > 1 - edge || ny < edge || ny > 1 - edge) return false
  if (ny > screenUISafeZones.bottom.y) return false
  if (nx > screenUISafeZones.topRight.x && ny < screenUISafeZones.topRight.y + screenUISafeZones.topRight.height) return false
  return true
}

function findLowDetailCandidateRegions (cells, width, height, subjectAvoidanceRegions = []) {
  const regions = []
  const visited = new Set()
  const eligible = cell => cell.safe &&
    cell.textureDensity < 0.2 &&
    cell.contrast < 0.2 &&
    !pointInRegions((cell.x + 0.5) / width, (cell.y + 0.5) / height, subjectAvoidanceRegions)
  for (const cell of cells) {
    const key = `${cell.x}:${cell.y}`
    if (visited.has(key) || !eligible(cell)) continue
    const queue = [cell]
    const members = []
    visited.add(key)
    while (queue.length) {
      const current = queue.shift()
      members.push(current)
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = current.x + dx
        const ny = current.y + dy
        const nextKey = `${nx}:${ny}`
        if (nx < 0 || ny < 0 || nx >= width || ny >= height || visited.has(nextKey)) continue
        const next = cells[ny * width + nx]
        if (!eligible(next)) continue
        visited.add(nextKey)
        queue.push(next)
      }
    }
    if (members.length < 3) continue
    const xs = members.map(member => member.x)
    const ys = members.map(member => member.y)
    const avgBrightness = members.reduce((sum, member) => sum + member.brightness, 0) / members.length
    const avgTexture = members.reduce((sum, member) => sum + member.textureDensity, 0) / members.length
    const region = {
      x: Math.min(...xs) / width,
      y: Math.min(...ys) / height,
      width: (Math.max(...xs) - Math.min(...xs) + 1) / width,
      height: (Math.max(...ys) - Math.min(...ys) + 1) / height,
      area: members.length,
      avgBrightness,
      avgTexture,
      centerX: (Math.min(...xs) + Math.max(...xs) + 1) / 2 / width,
      centerY: (Math.min(...ys) + Math.max(...ys) + 1) / 2 / height
    }
    const overlapsSubject = subjectAvoidanceRegions.some(subject => rectIntersectionArea(region, subject) > Math.min(region.width * region.height * 0.18, 0.035))
    if (!overlapsSubject) regions.push(region)
  }
  return regions.sort((a, b) => b.area - a.area)
}

function pointInRegions (x, y, regions = []) {
  return regions.some(region => x >= region.x && x <= region.x + region.width && y >= region.y && y <= region.y + region.height)
}

function estimateHorizon (brightnessMap, saturationMap, width, height) {
  let bestY = 0.5
  let bestScore = 0
  for (let y = 2; y < height - 2; y++) {
    let brightnessDelta = 0
    let saturationDelta = 0
    for (let x = 0; x < width; x++) {
      brightnessDelta += Math.abs(brightnessMap[y][x] - brightnessMap[y - 1][x])
      saturationDelta += Math.abs(saturationMap[y][x] - saturationMap[y - 1][x])
    }
    const score = brightnessDelta / width / 255 + saturationDelta / width
    if (score > bestScore) {
      bestScore = score
      bestY = y / height
    }
  }
  return {
    y: bestY,
    confidence: clamp(bestScore * 3, 0, 1)
  }
}

function recommendedMoodForImage (subject, metrics) {
  if (metrics.topOpen > 18 && metrics.avg > 145) return 'open-sky'
  if (subject === 'subject-landscape' && metrics.detail < 0.17) return 'horizon-calm'
  if (subject === 'subject-plant' || subject === 'subject-texture') return 'quiet-natural'
  if (subject === 'subject-city' || subject === 'subject-architecture') return 'structured-editorial'
  return 'editorial-calm'
}

function paletteFromDominantColor (dominant, avgBrightness) {
  const hue = Number.isFinite(dominant.h) ? dominant.h : 44
  return {
    hue,
    saturation: dominant.s,
    light: hslToHex(hue, clamp(0.12 + dominant.s * 0.18, 0.12, 0.24), 0.92),
    mutedLight: hslToHex(hue, clamp(0.10 + dominant.s * 0.14, 0.1, 0.22), 0.84),
    dark: hslToHex(hue, clamp(0.16 + dominant.s * 0.14, 0.16, 0.32), avgBrightness > 165 ? 0.16 : 0.12),
    mutedDark: hslToHex(hue, clamp(0.12 + dominant.s * 0.14, 0.12, 0.28), 0.23)
  }
}

function paletteFromColors (colors, dominant, avgBrightness) {
  const base = paletteFromDominantColor(dominant, avgBrightness)
  if (!colors?.length) return base
  const swatches = colors
    .map(color => {
      const hsl = rgbToHsl(color.r, color.g, color.b)
      return { ...color, hsl, brightness: luminance(color.r, color.g, color.b) }
    })
  const light = swatches
    .filter(color => color.brightness > 150 && color.hsl.s < 0.72)
    .sort((a, b) => b.brightness - a.brightness)[0]
  const dark = swatches
    .filter(color => color.brightness < 150 && color.hsl.s < 0.72)
    .sort((a, b) => a.brightness - b.brightness)[0]
  const muted = swatches
    .sort((a, b) => Math.abs(a.hsl.s - 0.24) - Math.abs(b.hsl.s - 0.24))[0]
  return {
    ...base,
    light: light ? hslToHex(light.hsl.h, clamp(light.hsl.s, 0.12, 0.38), 0.9) : base.light,
    mutedLight: muted ? hslToHex(muted.hsl.h, clamp(muted.hsl.s, 0.1, 0.28), 0.82) : base.mutedLight,
    dark: dark ? hslToHex(dark.hsl.h, clamp(dark.hsl.s, 0.14, 0.34), 0.14) : base.dark,
    mutedDark: muted ? hslToHex(muted.hsl.h, clamp(muted.hsl.s, 0.12, 0.3), 0.24) : base.mutedDark
  }
}

function generatePosterLayoutCandidates (text, imageAnalysis, screenUI = screenUISafeZones, seed = '') {
  const openRegions = imageAnalysis.lowDetailCandidateRegions
  const bestRegion = openRegions[stableIndex(seed || text.displayTitle, Math.max(openRegions.length, 1))] || fallbackTypographyRegion(imageAnalysis)
  const candidates = []
  const palette = imageAnalysis.dominantPalette
  const brightRegion = bestRegion.avgBrightness > 156
  const baseColor = brightRegion ? palette.dark : palette.light
  const subtleColor = brightRegion ? palette.mutedDark : palette.mutedLight
  const titleForFit = text.displayTitle

  const addCandidate = (layoutType, options) => {
    if (!layoutAllowedForText(layoutType, text)) return
    const normalized = normalizeCandidateTypography(layoutType, options, text, imageAnalysis)
    const targetWidth = normalized.targetWidth
    const titleLines = titleLinesForCandidate(titleForFit, text, normalized.maxLines)
    const maxLines = Math.max(titleLines.length || 1, 1)
    const fontFamily = options.fontFamily
    const fontWeight = normalized.fontWeight
    const fontSize = fitTextToWidth(titleForFit, { fontFamily, fontWeight }, targetWidth, maxLines, {
      ...normalized,
      titleLines
    })
    const candidate = {
      layoutType,
      anchor: normalized.anchor,
      x: normalized.x,
      y: normalized.y,
      maxWidth: targetWidth,
      maxLines,
      titleLines,
      fontFamily,
      fontWeight,
      fontSize,
      lineHeight: normalized.lineHeight,
      letterSpacing: normalized.letterSpacing,
      color: options.color || baseColor,
      showInstruction: Boolean(text.instruction),
      subtitleStyle: {
        fontSize: Math.round(fontSize * normalized.instructionScale),
        color: options.subtitleColor || subtleColor
      },
      scrimStyle: normalized.scrimStyle || options.scrimStyle || 'none',
      scrimOpacity: normalized.scrimOpacity,
      decorationLevel: options.decorationLevel || 0,
      text,
      region: options.region || bestRegion
    }
    candidates.push(withSecondaryInfoSlots(candidate, text, imageAnalysis, screenUI))
  }

  if (imageAnalysis.skyOrOpenAreaEstimate > 0.28 || imageAnalysis.openAreaRatio > 0.34) {
    addCandidate('HeroSkyCenter', {
      anchor: 'center-top',
      x: clamp(bestRegion.centerX, 0.32, 0.58),
      y: clamp(bestRegion.centerY, 0.18, 0.44),
      targetWidth: text.isCjk ? 0.42 : text.isShortWord ? 0.68 : 0.56,
      maxLines: text.isCjk ? cjkPreferredLineCount(text) : 1,
      fontFamily: 'poster-sans-heavy',
      fontWeight: 700,
      lineHeight: text.isCjk ? 1.06 : 0.9,
      letterSpacing: text.isShortWord ? 0.18 : text.isCjk ? 0.08 : 0.06,
      color: baseColor,
      decorationLevel: 0,
      region: bestRegion
    })
  }

  if (imageAnalysis.horizonEstimate.confidence > 0.32 || imageAnalysis.recommendedMood === 'horizon-calm') {
    addCandidate('HorizonOverlay', {
      anchor: 'horizon-center',
      x: 0.5,
      y: clamp(imageAnalysis.horizonEstimate.y + 0.03, 0.26, 0.68),
      targetWidth: text.isCjk ? 0.4 : text.isShortWord ? 0.72 : 0.58,
      maxLines: text.isCjk ? cjkPreferredLineCount(text) : 1,
      fontFamily: 'poster-sans-heavy',
      fontWeight: 700,
      lineHeight: text.isCjk ? 1.04 : 0.92,
      letterSpacing: text.isShortWord ? 0.1 : text.isCjk ? 0.055 : 0.035,
      color: baseColor,
      showSubtitle: false,
      scrimStyle: imageAnalysis.avgDetail > 0.2 ? 'subtle-gradient' : 'none',
      region: bestRegion
    })
  }

  if (imageAnalysis.subject === 'subject-landscape' && imageAnalysis.avgDetail < 0.24) {
    addCandidate('LandscapeEditorial', {
      anchor: 'depth-center',
      x: clamp(bestRegion.centerX, 0.35, 0.62),
      y: clamp(imageAnalysis.horizonEstimate.y + (foregroundDepthLikely(imageAnalysis) ? 0.08 : 0.12), 0.34, 0.56),
      targetWidth: text.isCjk ? 0.38 : text.isShortWord ? 0.58 : 0.48,
      maxLines: text.isCjk ? cjkPreferredLineCount(text) : 2,
      fontFamily: text.isCjk ? 'poster-cjk-modern' : 'poster-sans-heavy',
      fontWeight: text.isCjk ? 600 : 700,
      lineHeight: text.isCjk ? 1.02 : 0.9,
      letterSpacing: text.isCjk ? 0 : 0.035,
      color: baseColor,
      showInstruction: true,
      subtitleScale: 0.16,
      region: bestRegion
    })
  }

  const complexNaturalScene = isComplexNaturalScene(imageAnalysis)
  if (foregroundDepthStrong(imageAnalysis) && !text.isInstructionPoster) {
    addCandidate('DepthLockscreenPoster', {
      anchor: 'depth-center',
      x: clamp(bestRegion.centerX, 0.42, 0.58),
      y: clamp((imageAnalysis.horizonEstimate.y || bestRegion.centerY) + 0.06, 0.38, 0.56),
      targetWidth: text.isCjk ? 0.46 : text.isShortWord ? 0.72 : 0.58,
      maxLines: text.isCjk ? cjkPreferredLineCount(text) : 1,
      fontFamily: text.isCjk ? 'poster-cjk-modern' : 'poster-sans-heavy',
      fontWeight: text.isCjk ? 650 : 800,
      lineHeight: text.isCjk ? 1 : 0.88,
      letterSpacing: text.isCjk ? 0 : 0.03,
      color: baseColor,
      showInstruction: true,
      subtitleScale: 0.14,
      decorationLevel: 0,
      region: bestRegion
    })
  }
  const calmAnchor = complexNaturalScene
    ? bestRegion.centerX > 0.64 ? 'right-center' : bestRegion.centerX < 0.44 ? 'left-center' : 'center-top'
    : bestRegion.centerX < 0.5 ? 'left-center' : 'right-center'
  const calmTargetWidth = text.isCjk ? (complexNaturalScene ? 0.3 : 0.32) : 0.36
  addCandidate('CalmInstructionPoster', {
    anchor: calmAnchor,
    x: calmAnchor === 'center-top'
      ? clamp(bestRegion.centerX, 0.38, 0.6)
      : calmAnchor.includes('right')
        ? clamp(bestRegion.x + bestRegion.width * 0.88, 0.52, 0.84)
        : clamp(bestRegion.x + bestRegion.width * 0.24, 0.14, 0.46),
    y: complexNaturalScene ? clamp(bestRegion.y + bestRegion.height * 0.36, 0.18, 0.42) : clamp(bestRegion.centerY, 0.16, 0.66),
    targetWidth: calmTargetWidth,
    maxLines: text.isCjk ? cjkPreferredLineCount(text) : 2,
    fontFamily: text.isCjk ? 'poster-cjk-modern' : 'poster-sans',
    fontWeight: text.isCjk ? 500 : 500,
    lineHeight: text.isCjk ? 1.18 : 1.08,
    letterSpacing: text.isCjk ? 0.05 : 0.025,
    color: baseColor,
    showInstruction: true,
    subtitleScale: 0.16,
    decorationLevel: 0,
    region: bestRegion
  })

  addCandidate('MinimalPhrase', {
    anchor: complexNaturalScene ? calmAnchor : bestRegion.centerX < 0.5 ? 'left-center' : 'right-center',
    x: complexNaturalScene
      ? calmAnchor === 'center-top'
        ? clamp(bestRegion.centerX, 0.38, 0.6)
        : calmAnchor.includes('right')
          ? clamp(bestRegion.x + bestRegion.width * 0.9, 0.52, 0.84)
          : clamp(bestRegion.x + bestRegion.width * 0.22, 0.14, 0.46)
      : clamp(bestRegion.x + bestRegion.width * 0.08, 0.08, 0.74),
    y: complexNaturalScene ? clamp(bestRegion.y + bestRegion.height * 0.4, 0.18, 0.44) : clamp(bestRegion.centerY, 0.16, 0.72),
    targetWidth: text.isCjk ? clamp(bestRegion.width * 0.72, complexNaturalScene ? 0.24 : 0.2, complexNaturalScene ? 0.34 : imageAnalysis.avgDetail > 0.22 ? 0.34 : 0.42) : clamp(bestRegion.width * 0.92, 0.28, imageAnalysis.avgDetail > 0.22 ? 0.42 : 0.5),
    maxLines: text.isCjk ? cjkPreferredLineCount(text) : 2,
    fontFamily: text.isCjk ? 'poster-cjk-modern' : 'poster-sans',
    fontWeight: text.isCjk ? 500 : 600,
    lineHeight: text.isCjk ? 1.16 : 1.02,
    letterSpacing: text.isCjk ? 0.055 : 0.035,
    color: baseColor,
    showInstruction: true,
    subtitleScale: 0.14,
    scrimStyle: imageAnalysis.avgDetail > 0.2 ? 'subtle-gradient' : 'none',
    decorationLevel: 0,
    region: bestRegion
  })

  if (imageAnalysis.openAreaRatio > 0.36) {
    addCandidate('FullTypographicPoster', {
      anchor: 'open-area',
      x: clamp(bestRegion.centerX, 0.28, 0.68),
      y: clamp(bestRegion.centerY, 0.18, 0.58),
      targetWidth: text.isCjk ? 0.42 : text.isShortWord ? 0.78 : 0.62,
      maxLines: text.isCjk ? cjkPreferredLineCount(text) : 2,
      fontFamily: text.isCjk ? 'poster-cjk-modern' : 'poster-sans-heavy',
      fontWeight: 700,
      lineHeight: text.isCjk ? 1.04 : 0.9,
      letterSpacing: text.isShortWord ? 0.16 : text.isCjk ? 0.07 : 0.045,
      color: baseColor,
      showSubtitle: false,
      decorationLevel: 0,
      region: bestRegion
    })
  }

  return candidates.filter(candidate => candidatePassesHardConstraints(candidate, imageAnalysis, screenUI))
}

function isInstructionPosterText (text = {}) {
  return Boolean(text.isInstructionPoster || text.isInstructionTitle)
}

function layoutAllowedForText (layoutType, text) {
  if (!isInstructionPosterText(text)) return true
  return ['CalmInstructionPoster', 'MinimalPhrase', 'LandscapeEditorial'].includes(layoutType)
}

function cjkPreferredLineCount (text) {
  if (!text.isCjk) return 1
  if (text.length <= 7) return 1
  return 2
}

function cjkProtectedRanges (text) {
  const ranges = []
  cjkProtectedTerms.forEach(term => {
    let start = text.indexOf(term)
    while (start !== -1) {
      ranges.push({ start, end: start + term.length })
      start = text.indexOf(term, start + 1)
    }
  })
  return ranges
}

function cjkBreakSplitsProtectedTerm (text, index) {
  return cjkProtectedRanges(text).some(range => range.start < index && index < range.end)
}

function cjkSemanticSplitScore (text, index) {
  const left = text.slice(0, index)
  const right = text.slice(index)
  const balanceScore = 18 - Math.abs(left.length - right.length) * 4
  const leftEndsWithTerm = cjkProtectedTerms.some(term => left.endsWith(term))
  const rightStartsWithTerm = cjkProtectedTerms.some(term => right.startsWith(term))
  const actionBoundary = /(休息|放松|转动|拉伸|重置|检查|闭眼)$/.test(left) || /^(休息|放松|转动|拉伸|重置|检查|闭眼)/.test(right)
  return balanceScore + (leftEndsWithTerm ? 10 : 0) + (rightStartsWithTerm ? 8 : 0) + (actionBoundary ? 8 : 0)
}

function cjkSemanticTitleLines (title, maxLines = 2) {
  const text = String(title || '').replace(/\s+/g, '')
  if (!/[\u4e00-\u9fff]/.test(text)) return String(title || '').split(/\s+/).filter(Boolean)
  if (!text) return []
  if (text.length <= 7 || maxLines <= 1) return [text]

  const allowedSplits = []
  for (let index = 3; index <= text.length - 3; index++) {
    if (cjkBreakSplitsProtectedTerm(text, index)) continue
    allowedSplits.push(index)
  }
  if (!allowedSplits.length) return [text]
  const split = allowedSplits
    .sort((a, b) => cjkSemanticSplitScore(text, b) - cjkSemanticSplitScore(text, a))[0]
  return [text.slice(0, split), text.slice(split)].filter(Boolean)
}

function cjkTitleSegments (title) {
  return cjkSemanticTitleLines(title, 2)
}

function cjkTitleHasBrokenProtectedWord (lines) {
  if (!Array.isArray(lines) || lines.length < 2) return false
  const joined = lines.join('')
  return cjkProtectedTerms.some(term => {
    const start = joined.indexOf(term)
    if (start === -1) return false
    const end = start + term.length
    let cursor = 0
    for (const line of lines) {
      cursor += line.length
      if (start < cursor && cursor < end) return true
    }
    return false
  })
}

function titleLinesForCandidate (title, text, maxLines) {
  if (!text.isCjk) return [String(title || '').trim()].filter(Boolean)
  return cjkSemanticTitleLines(title, maxLines)
}

function normalizeCandidateTypography (layoutType, options, text, analysis) {
  let targetWidth = options.targetWidth
  let maxLines = options.maxLines || 1
  let fontWeight = options.fontWeight
  let lineHeight = options.lineHeight
  let letterSpacing = options.letterSpacing
  const instructionPoster = isInstructionPosterText(text)
  const complexScene = analysis.avgDetail > 0.22 || ['subject-people', 'subject-plant', 'subject-city', 'subject-architecture', 'subject-object'].includes(analysis.subject)

  if (text.isCjk) {
    const minWidth = instructionPoster || complexScene ? 0.18 : 0.22
    const maxWidth = instructionPoster ? 0.36 : complexScene ? 0.34 : analysis.openAreaRatio > 0.55 ? 0.48 : 0.42
    targetWidth = clamp(targetWidth, minWidth, maxWidth)
    maxLines = Math.min(maxLines, cjkPreferredLineCount(text), 2)
    fontWeight = Math.min(fontWeight, instructionPoster ? 600 : 650)
    lineHeight = Math.max(lineHeight, 1.08)
    letterSpacing = 0
  }

  if (instructionPoster) {
    targetWidth = clamp(targetWidth, 0.2, 0.36)
    maxLines = Math.min(maxLines, 2)
    fontWeight = Math.min(fontWeight, 600)
  }

  return {
    ...options,
    targetWidth,
    maxLines,
    fontWeight,
    lineHeight,
    letterSpacing,
    scrimStyle: options.scrimStyle || (complexScene && layoutType === 'MinimalPhrase' ? 'subtle-gradient' : 'none'),
    scrimOpacity: options.scrimStyle === 'subtle-gradient' || (complexScene && layoutType === 'MinimalPhrase')
      ? clamp(analysis.avgDetail * 0.55, 0.12, 0.24)
      : 0,
    instructionScale: clamp(options.subtitleScale || (instructionPoster ? 0.16 : 0.14), 0.12, instructionPoster ? 0.2 : 0.18)
  }
}

function withSecondaryInfoSlots (candidate, text, analysis, screenUI) {
  let slots = secondarySlotsForCandidate(candidate, text, analysis, screenUI)
  const showInstruction = Boolean(text.instruction && slots.instructionSlot)
  const complexity = metadataComplexity(analysis)
  const instructionRect = slots.instructionSlot ? slotRect(slots.instructionSlot) : null
  slots = downgradeCollidingMetadataSlots(slots, text, candidateBounds(candidate), instructionRect)
  const showCategory = Boolean(text.category && slots.categorySlot)
  const showCredit = Boolean(text.credit && slots.creditSlot)
  const visibleMetadataCount = [showInstruction, showCategory, showCredit].filter(Boolean).length
  const categoryRect = slots.categorySlot ? metadataRectForSlot(slots.categorySlot, text.category) : null
  const creditRect = slots.creditSlot ? metadataRectForSlot(slots.creditSlot, text.credit) : null
  const withSlots = {
    ...candidate,
    titleRect: candidateBounds(candidate),
    showInstruction,
    showSubtitle: showInstruction,
    instructionSlot: slots.instructionSlot,
    instructionRect,
    showCategory,
    categorySlot: slots.categorySlot,
    categoryRect,
    showCredit,
    creditSlot: slots.creditSlot,
    creditRect,
    metadataOpacity: complexity > 0.65 ? 0.48 : 0.56,
    metadataMaxWidth: complexity > 0.65 ? 0.16 : 0.22,
    metadataVisibleCount: visibleMetadataCount
  }
  return withLocalTextContrast(withSlots, analysis)
}

function downgradeCollidingMetadataSlots (slots, text, titleRect, instructionRect) {
  const instructionPoster = isInstructionPosterText(text)
  const titleAvoidanceBox = expandedTitleRect(titleRect, instructionPoster ? 0.13 : 0.06)
  let categorySlot = slots.categorySlot
  let creditSlot = slots.creditSlot
  const categoryRect = categorySlot ? metadataRectForSlot(categorySlot, text.category) : null
  const creditRect = creditSlot ? metadataRectForSlot(creditSlot, text.credit) : null
  const metadataHitsPrimary = rect => rect && (
    rectsOverlap(rect, titleAvoidanceBox) ||
    (instructionRect && rectsOverlap(rect, expandedTitleRect(instructionRect, 0.025)))
  )
  if (metadataHitsPrimary(categoryRect)) categorySlot = null
  if (metadataHitsPrimary(creditRect)) creditSlot = null
  if (categorySlot && creditSlot) {
    const resolvedCategoryRect = metadataRectForSlot(categorySlot, text.category)
    const resolvedCreditRect = metadataRectForSlot(creditSlot, text.credit)
    if (rectsOverlap(resolvedCategoryRect, resolvedCreditRect)) {
      if (instructionPoster) categorySlot = null
      else creditSlot = null
    }
  }
  return { ...slots, categorySlot, creditSlot }
}

function secondarySlotsForCandidate (candidate, text, analysis, screenUI) {
  const titleBox = candidateBounds(candidate)
  const instructionPoster = isInstructionPosterText(text)
  const titleAvoidanceBox = expandedTitleRect(titleBox, instructionPoster ? 0.13 : 0.06)
  const nearTitleSmall = {
    ...secondaryInfoSlots.nearTitleSmall,
    x: titleBox.x,
    y: Math.min(titleBox.y + titleBox.height + 0.035, screenUI.bottom.y - 0.1),
    width: Math.min(candidate.maxWidth, 0.32),
    height: 0.055,
    anchor: candidate.anchor.includes('right') ? 'right' : 'left'
  }
  const metadataSlots = metadataSlotsForTitle(titleBox, text)
  const slotOrder = [
    nearTitleSmall,
    ...metadataSlots
  ]
  const safeSlots = slotOrder
    .filter(slot => secondarySlotIsSafe(slot, analysis, screenUI, titleBox, titleAvoidanceBox))
    .sort((a, b) => metadataSlotScore(b, analysis, titleBox) - metadataSlotScore(a, analysis, titleBox))
  const instructionSlot = secondarySlotIsSafe(nearTitleSmall, analysis, screenUI, titleBox, titleAvoidanceBox)
    ? nearTitleSmall
    : safeSlots[0]
  const categorySlot = safeSlots.find(slot => slot.name !== instructionSlot?.name && metadataSlotAllowedForRole(slot, 'category'))
  const creditSlot = safeSlots.find(slot => ![instructionSlot?.name, categorySlot?.name].includes(slot.name) && metadataSlotAllowedForRole(slot, 'credit'))
  return { instructionSlot, categorySlot, creditSlot }
}

function metadataSlotsForTitle (titleBox, text) {
  const titleOnLeft = titleBox.x + titleBox.width / 2 < 0.5
  const oppositeSide = titleOnLeft ? 'right' : 'left'
  const sameSide = titleOnLeft ? 'left' : 'right'
  if (isInstructionPosterText(text)) {
    return [
      { name: 'quietCorner', x: oppositeSide === 'right' ? 0.86 : 0.08, y: 0.12, width: 0.2, height: 0.04, anchor: oppositeSide },
      { name: 'lowerEdgeSubtle', x: oppositeSide === 'right' ? 0.86 : 0.08, y: 0.72, width: 0.26, height: 0.04, anchor: oppositeSide },
      { name: 'quietCorner', x: sameSide === 'right' ? 0.86 : 0.08, y: 0.12, width: 0.2, height: 0.04, anchor: sameSide },
      { name: 'lowerEdgeSubtle', x: sameSide === 'right' ? 0.86 : 0.08, y: 0.72, width: 0.26, height: 0.04, anchor: sameSide }
    ]
  }
  return [
    { name: 'upperEdgeSubtle', x: 0.5, y: 0.075, width: 0.22, height: 0.04, anchor: 'center' },
    { name: 'sideMetadata', x: oppositeSide === 'right' ? 0.92 : 0.08, y: 0.42, width: 0.18, height: 0.08, anchor: oppositeSide },
    { name: 'quietCorner', x: oppositeSide === 'right' ? 0.92 : 0.08, y: 0.11, width: 0.2, height: 0.04, anchor: oppositeSide },
    { name: 'lowerEdgeSubtle', x: oppositeSide === 'right' ? 0.9 : 0.08, y: 0.74, width: 0.26, height: 0.04, anchor: oppositeSide },
    { name: 'sideMetadata', x: sameSide === 'right' ? 0.92 : 0.08, y: 0.58, width: 0.18, height: 0.08, anchor: sameSide },
    { name: 'quietCorner', x: sameSide === 'right' ? 0.92 : 0.08, y: 0.11, width: 0.2, height: 0.04, anchor: sameSide }
  ]
}

function metadataSlotAllowedForRole (slot, role) {
  if (role === 'category') return ['upperEdgeSubtle', 'sideMetadata', 'quietCorner'].includes(slot.name)
  if (role === 'credit') return ['lowerEdgeSubtle', 'quietCorner', 'sideMetadata'].includes(slot.name)
  return false
}

function secondarySlotIsSafe (slot, analysis, screenUI, titleBox, titleAvoidanceBox) {
  const rect = slotRect(slot)
  if (rectsOverlap(rect, screenUI.bottom) || rectsOverlap(rect, screenUI.topRight)) return false
  if (slot.name !== 'nearTitleSmall' && rectsOverlap(rect, titleAvoidanceBox)) return false
  if (rect.x < screenUI.edgePadding || rect.y < screenUI.edgePadding || rect.x + rect.width > 1 - screenUI.edgePadding || rect.y + rect.height > 1 - screenUI.edgePadding) return false
  return regionTextureAt(rect, analysis) < 0.32
}

function metadataSlotScore (slot, analysis, titleBox) {
  const rect = slotRect(slot)
  const textureScore = clamp(1 - regionTextureAt(rect, analysis), 0, 1) * 42
  const distance = Math.abs(rect.x - titleBox.x) + Math.abs(rect.y - titleBox.y)
  return textureScore + Math.min(distance * 20, 20)
}

function slotRect (slot) {
  const x = slot.anchor === 'right' ? slot.x - slot.width : slot.anchor === 'center' ? slot.x - slot.width / 2 : slot.x
  return { x, y: slot.y, width: slot.width, height: slot.height }
}

function metadataRectForSlot (slot, value) {
  const rect = slotRect(slot)
  const textLength = String(value || '').replace(/\s+/g, '').length
  const charsPerLine = Math.max(Math.floor(rect.width * 72), 8)
  const lines = Math.max(Math.ceil(textLength / charsPerLine), 1)
  return {
    ...rect,
    height: clamp(lines * 0.026 + 0.018, rect.height, 0.14)
  }
}

function withLocalTextContrast (candidate, analysis) {
  const titleBackground = localBackgroundForRect(candidate.titleRect, analysis)
  const titleColor = readableTextColorForBackground(titleBackground, 3)
  const titleContrast = contrastRatioForBrightness(titleColor.brightness, titleBackground.brightness)
  const titleOpacity = 0.92

  const instructionBackground = candidate.instructionRect ? localBackgroundForRect(candidate.instructionRect, analysis) : titleBackground
  const instructionColor = readableTextColorForBackground(instructionBackground, 3)
  const instructionContrast = contrastRatioForBrightness(instructionColor.brightness, instructionBackground.brightness)
  const instructionOpacity = candidate.showInstruction ? 0.78 : 0

  const metadataRects = [candidate.categoryRect, candidate.creditRect].filter(Boolean)
  const metadataBackground = metadataRects.length
    ? localBackgroundForRect(combinedRect(metadataRects), analysis)
    : titleBackground
  const metadataColor = readableTextColorForBackground(metadataBackground, 2)
  const metadataContrast = contrastRatioForBrightness(metadataColor.brightness, metadataBackground.brightness)
  const metadataOpacity = Math.max(candidate.metadataOpacity || 0.56, 0.52)

  const needsScrim = titleContrast < 3.2 || instructionContrast < 3.1 || titleBackground.texture > 0.24
  const scrimOpacity = candidate.scrimStyle === 'none' && !needsScrim
    ? 0
    : clamp(Math.max(candidate.scrimOpacity || 0, needsScrim ? 0.14 : 0), 0.12, 0.28)

  return {
    ...candidate,
    color: titleColor.hex,
    titleOpacity,
    titleBackground,
    titleContrast,
    subtitleStyle: {
      ...candidate.subtitleStyle,
      color: instructionColor.hex
    },
    instructionOpacity,
    instructionBackground,
    instructionContrast,
    metadataColor: metadataColor.hex,
    metadataOpacity,
    metadataBackground,
    metadataContrast,
    scrimStyle: scrimOpacity > 0 ? 'subtle-gradient' : 'none',
    scrimOpacity
  }
}

function localBackgroundForRect (rect, analysis) {
  if (!rect) return { brightness: analysis.avgBrightness || 128, texture: analysis.avgDetail || 0.18 }
  if (!analysis.cells?.length) {
    return {
      brightness: rectApproxBrightness(rect, analysis),
      texture: regionTextureAt(rect, analysis)
    }
  }
  const minX = Math.max(Math.floor(rect.x * analysis.width), 0)
  const maxX = Math.min(Math.ceil((rect.x + rect.width) * analysis.width), analysis.width)
  const minY = Math.max(Math.floor(rect.y * analysis.height), 0)
  const maxY = Math.min(Math.ceil((rect.y + rect.height) * analysis.height), analysis.height)
  let brightness = 0
  let texture = 0
  let count = 0
  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      const cell = analysis.cells[y * analysis.width + x]
      if (!cell) continue
      brightness += cell.brightness
      texture += cell.textureDensity
      count++
    }
  }
  return {
    brightness: count ? brightness / count : rectApproxBrightness(rect, analysis),
    texture: count ? texture / count : regionTextureAt(rect, analysis)
  }
}

function rectApproxBrightness (rect, analysis) {
  const regions = analysis.lowDetailCandidateRegions || []
  const local = regions
    .filter(region => rectIntersectionArea(rect, region) > 0)
    .sort((a, b) => rectIntersectionArea(rect, b) - rectIntersectionArea(rect, a))[0]
  return local?.avgBrightness ?? analysis.avgBrightness ?? 128
}

function readableTextColorForBackground (background, minimumContrast) {
  const darkChoices = [
    textColorOption('#17212b'),
    textColorOption('#1e2218'),
    textColorOption('#241f1a')
  ]
  const lightChoices = [
    textColorOption('#fff7e6'),
    textColorOption('#f5ecd7'),
    textColorOption('#f2ead7')
  ]
  const choices = background.brightness >= 142 ? darkChoices : lightChoices
  const fallback = background.brightness >= 142 ? darkChoices[0] : lightChoices[0]
  return choices.find(choice => contrastRatioForBrightness(choice.brightness, background.brightness) >= minimumContrast) || fallback
}

function textColorOption (hex) {
  return {
    hex,
    brightness: relativeLuminanceFromHex(hex) * 255
  }
}

function contrastRatioForBrightness (foregroundBrightness, backgroundBrightness) {
  const foreground = relativeLuminanceFromGray(foregroundBrightness)
  const background = relativeLuminanceFromGray(backgroundBrightness)
  const lighter = Math.max(foreground, background)
  const darker = Math.min(foreground, background)
  return (lighter + 0.05) / (darker + 0.05)
}

function relativeLuminanceFromGray (brightness) {
  const normalized = clamp(brightness / 255, 0, 1)
  return normalized <= 0.03928
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4)
}

function relativeLuminanceFromHex (hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  const channel = value => {
    const normalized = value / 255
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4)
  }
  return channel(rgb.r) * 0.2126 + channel(rgb.g) * 0.7152 + channel(rgb.b) * 0.0722
}

function combinedRect (rects) {
  const minX = Math.min(...rects.map(rect => rect.x))
  const minY = Math.min(...rects.map(rect => rect.y))
  const maxX = Math.max(...rects.map(rect => rect.x + rect.width))
  const maxY = Math.max(...rects.map(rect => rect.y + rect.height))
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

function candidatePassesHardConstraints (candidate, analysis, screenUI) {
  if (overlapsScreenUI(candidate, screenUI)) return false
  if (cjkViolatesHardScale(candidate, candidate.text)) return false
  if (cjkTitleHasBrokenProtectedWord(candidate.titleLines)) return false
  if (candidate.text?.isCjk && candidate.titleLines?.some(line => line.length > 0 && line.length < 3) && candidate.titleLines.length > 1) return false
  if (subjectOcclusionTooHigh(candidate, analysis)) return false
  if (metadataInsideTitle(candidate)) return false
  if (metadataRectsCollide(candidate)) return false
  if (textContrastTooLow(candidate)) return false
  if (textOpacityTooLow(candidate)) return false
  if (looksLikeCornerHeader(candidate)) return false
  if (overDarkScrim(candidate, analysis)) return false
  const infoRects = [candidate.instructionRect, candidate.categoryRect, candidate.creditRect]
    .filter(Boolean)
  return infoRects.every(rect => !rectsOverlap(rect, screenUI.bottom) && !rectsOverlap(rect, screenUI.topRight))
}

function cjkViolatesHardScale (candidate, text) {
  if (!text.isCjk) return false
  const titleHeight = candidateTitleHeight(candidate)
  const singleCharHeight = candidate.fontSize / 900
  return candidate.maxLines > 2 || titleHeight > 0.28 || singleCharHeight > 0.16
}

function scoreAndSelectLayout (candidates, analysis, text) {
  const scored = candidates.map(candidate => {
    const imageFitScore = imageFitForCandidate(candidate, analysis)
    const readabilityScore = readabilityForCandidate(candidate)
    const posterImpactScore = posterImpactForCandidate(candidate, text)
    const calmnessScore = calmnessForCandidate(candidate)
    const uiConflictScore = 18
    const clutterPenalty = candidate.decorationLevel * 12 + (candidate.metadataVisibleCount > 2 ? 4 : 0)
    const centerTemplatePenalty = candidate.anchor === 'center' && candidate.layoutType !== 'HeroSkyCenter' ? 18 : 0
    const cornerInfoBlockPenalty = candidate.x > 0.68 && candidate.y < 0.2 ? 34 : 0
    const subjectOcclusionPenalty = subjectOcclusionForCandidate(candidate, analysis)
    const cjkScalePenalty = cjkScalePenaltyForCandidate(candidate, text)
    const cjkLineBreakPenalty = cjkLineBreakPenaltyForCandidate(candidate, text)
    const instructionHeroPenalty = isInstructionPosterText(text) && ['HeroSkyCenter', 'FullTypographicPoster'].includes(candidate.layoutType) ? 90 : 0
    const metadataLegibilityScore = metadataLegibilityForCandidate(candidate, analysis)
    const metadataClutterPenalty = metadataClutterPenaltyForCandidate(candidate)
    const metadataUIBlockPenalty = metadataUIBlockPenaltyForCandidate(candidate)
    const metadataLossPenalty = text.instruction && !candidate.showInstruction ? 45 : 0
    const semanticLineBreakScore = semanticLineBreakScoreForCandidate(candidate, text)
    const metadataSeparationScore = metadataSeparationScoreForCandidate(candidate)
    const photoPreservationScore = photoPreservationScoreForCandidate(candidate, analysis)
    const posterAnchorScore = posterAnchorScoreForCandidate(candidate, analysis)
    const metadataInsideTitlePenalty = metadataInsideTitle(candidate) ? 140 : 0
    const cornerHeaderPenalty = looksLikeCornerHeader(candidate) ? 90 : 0
    const brokenChineseWordPenalty = cjkTitleHasBrokenProtectedWord(candidate.titleLines) ? 140 : 0
    const overDarkScrimPenalty = overDarkScrim(candidate, analysis) ? 120 : 0
    const titleContrastScore = titleContrastScoreForCandidate(candidate)
    const instructionContrastScore = instructionContrastScoreForCandidate(candidate)
    const metadataContrastScore = metadataContrastScoreForCandidate(candidate)
    const localBackgroundContrastScore = localBackgroundContrastScoreForCandidate(candidate)
    const metadataCollisionPenalty = metadataCollisionPenaltyForCandidate(candidate)
    const lowOpacityTextPenalty = lowOpacityTextPenaltyForCandidate(candidate)
    const accidentalWatermarkPenalty = accidentalWatermarkPenaltyForCandidate(candidate)
    const hierarchyClarityScore = hierarchyClarityScoreForCandidate(candidate)
    const posterScore = imageFitScore + readabilityScore + posterImpactScore + calmnessScore + uiConflictScore -
      clutterPenalty - centerTemplatePenalty - cornerInfoBlockPenalty - subjectOcclusionPenalty -
      cjkScalePenalty - cjkLineBreakPenalty - instructionHeroPenalty + metadataLegibilityScore -
      metadataClutterPenalty - metadataUIBlockPenalty - metadataLossPenalty +
      semanticLineBreakScore + metadataSeparationScore + photoPreservationScore + posterAnchorScore -
      metadataInsideTitlePenalty - cornerHeaderPenalty - brokenChineseWordPenalty - overDarkScrimPenalty +
      titleContrastScore + instructionContrastScore + metadataContrastScore + localBackgroundContrastScore +
      hierarchyClarityScore - metadataCollisionPenalty - lowOpacityTextPenalty - accidentalWatermarkPenalty
    return { ...candidate, posterScore }
  }).sort((a, b) => b.posterScore - a.posterScore)
  const selected = scored[0] || candidates[0] || fallbackPosterCandidate(text, analysis)
  return compositionFromPosterCandidate(selected, analysis)
}

function fitTextToWidth (text, font, targetWidth, maxLines, options = {}) {
  const length = Math.max(String(text || '').replace(/\s+/g, '').length, 1)
  const lines = options.titleLines?.length ? options.titleLines : null
  const lineLength = lines
    ? Math.max(...lines.map(line => String(line || '').replace(/\s+/g, '').length), 1)
    : Math.ceil(length / Math.max(maxLines, 1))
  const isCjk = /[\u4e00-\u9fff]/.test(text)
  const charFactor = isCjk ? 1.02 : 0.62
  const availablePixels = targetWidth * 1600
  const base = availablePixels / Math.max(lineLength * charFactor, 1)
  const min = options.minFontSize || (isCjk ? 52 : 82)
  let max = options.maxFontSize || (length <= 7 ? 238 : 176)
  if (isCjk) {
    const lineHeight = options.lineHeight || 1.12
    const maxSingleChar = 900 * 0.16
    const maxTotalHeight = 900 * 0.28 / Math.max(maxLines * lineHeight, 1)
    max = Math.min(max, maxSingleChar, maxTotalHeight)
  }
  return Math.round(clamp(base, min, max))
}

function candidateTitleHeight (candidate) {
  const lineCount = candidate.titleLines?.length || candidate.maxLines || 1
  return clamp((candidate.fontSize / 900) * candidate.lineHeight * lineCount, 0.06, 0.28)
}

function cjkScalePenaltyForCandidate (candidate, text) {
  if (!text.isCjk) return 0
  const singleCharHeight = candidate.fontSize / 900
  const titleHeight = candidateTitleHeight(candidate)
  const widthMax = isInstructionPosterText(text) ? 0.36 : candidate.text?.length <= 6 ? 0.42 : 0.48
  return Math.max(singleCharHeight - 0.145, 0) * 260 +
    Math.max(titleHeight - 0.26, 0) * 220 +
    Math.max(candidate.maxWidth - widthMax, 0) * 120
}

function cjkLineBreakPenaltyForCandidate (candidate, text) {
  if (!text.isCjk) return 0
  if (candidate.maxLines > 2) return 90
  if (text.length <= 7 && candidate.maxLines > 1) return 64
  const segmentLengths = (candidate.titleLines || cjkTitleSegments(text.displayTitle)).map(segment => segment.length)
  return segmentLengths.some(length => length > 0 && length < 3) ? 72 : 0
}

function semanticLineBreakScoreForCandidate (candidate, text) {
  if (!text.isCjk) return 0
  const lines = candidate.titleLines || []
  if (text.length <= 7 && lines.length === 1) return 42
  if (lines.length > 2) return -90
  if (cjkTitleHasBrokenProtectedWord(lines)) return -120
  if (lines.some(line => line.length > 0 && line.length < 3)) return -72
  return lines.length === 2 ? 24 : 12
}

function metadataInsideTitle (candidate) {
  const titleBox = expandedTitleRect(
    candidate.titleRect || candidateBounds(candidate),
    isInstructionPosterText(candidate.text) ? 0.13 : 0.06
  )
  return [candidate.categoryRect, candidate.creditRect]
    .filter(Boolean)
    .some(rect => rectsOverlap(rect, titleBox))
}

function metadataRectsCollide (candidate) {
  const metadataRects = [candidate.categoryRect, candidate.creditRect].filter(Boolean)
  if (metadataRects.length < 2) return false
  return rectsOverlap(metadataRects[0], metadataRects[1])
}

function textContrastTooLow (candidate) {
  if ((candidate.titleContrast || 0) < 3) return true
  if (candidate.showInstruction && (candidate.instructionContrast || 0) < 3) return true
  if ((candidate.showCategory || candidate.showCredit) && (candidate.metadataContrast || 0) < 2) return true
  return false
}

function textOpacityTooLow (candidate) {
  if ((candidate.titleOpacity || 0) < 0.72) return true
  if (candidate.showInstruction && (candidate.instructionOpacity || 0) < 0.65) return true
  if ((candidate.showCategory || candidate.showCredit) && (candidate.metadataOpacity || 0) < 0.45) return true
  return false
}

function metadataSeparationScoreForCandidate (candidate) {
  const titleBox = candidate.titleRect || candidateBounds(candidate)
  const metadataRects = [candidate.categoryRect, candidate.creditRect].filter(Boolean)
  if (!metadataRects.length) return 8
  if (metadataInsideTitle(candidate)) return -120
  return metadataRects.reduce((score, rect) => {
    const distance = Math.abs((rect.x + rect.width / 2) - (titleBox.x + titleBox.width / 2)) +
      Math.abs((rect.y + rect.height / 2) - (titleBox.y + titleBox.height / 2))
    return score + clamp(distance * 54, 8, 34)
  }, 0)
}

function titleContrastScoreForCandidate (candidate) {
  return clamp(((candidate.titleContrast || 0) - 3) * 18, -80, 42)
}

function instructionContrastScoreForCandidate (candidate) {
  if (!candidate.showInstruction) return 0
  return clamp(((candidate.instructionContrast || 0) - 3) * 14, -60, 34)
}

function metadataContrastScoreForCandidate (candidate) {
  if (!candidate.showCategory && !candidate.showCredit) return 0
  return clamp(((candidate.metadataContrast || 0) - 2) * 10, -42, 24)
}

function localBackgroundContrastScoreForCandidate (candidate) {
  const texturePenalty = (candidate.titleBackground?.texture || 0) > 0.24 ? 12 : 0
  return clamp((candidate.titleContrast || 0) * 6 - texturePenalty, 0, 36)
}

function metadataCollisionPenaltyForCandidate (candidate) {
  if (metadataRectsCollide(candidate)) return 110
  if (metadataInsideTitle(candidate)) return 140
  const titleBox = candidate.titleRect || candidateBounds(candidate)
  return [candidate.categoryRect, candidate.creditRect]
    .filter(Boolean)
    .some(rect => Math.abs((rect.x + rect.width / 2) - (titleBox.x + titleBox.width / 2)) < 0.18 &&
      Math.abs((rect.y + rect.height / 2) - (titleBox.y + titleBox.height / 2)) < 0.14)
    ? 72
    : 0
}

function lowOpacityTextPenaltyForCandidate (candidate) {
  return Math.max(0.72 - (candidate.titleOpacity || 0), 0) * 180 +
    Math.max(0.65 - (candidate.instructionOpacity || 0.65), 0) * 140 +
    Math.max(0.45 - (candidate.metadataOpacity || 0.45), 0) * 120
}

function accidentalWatermarkPenaltyForCandidate (candidate) {
  const metadataVisible = [candidate.showCategory, candidate.showCredit].filter(Boolean).length
  const weakMetadata = metadataVisible && (candidate.metadataOpacity || 0) < 0.5
  const crampedMetadata = metadataVisible && metadataSeparationScoreForCandidate(candidate) < 18
  return (weakMetadata ? 18 : 0) + (crampedMetadata ? 42 : 0)
}

function hierarchyClarityScoreForCandidate (candidate) {
  const titleSize = candidate.fontSize || 1
  const instructionSize = candidate.subtitleStyle?.fontSize || titleSize * 0.16
  const metadataSize = Math.round(titleSize * 0.065)
  const sizeHierarchy = titleSize > instructionSize * 3 && instructionSize > metadataSize * 1.2 ? 28 : -24
  const opacityHierarchy = (candidate.titleOpacity || 0) > (candidate.instructionOpacity || 0) &&
    (candidate.instructionOpacity || 0) > (candidate.metadataOpacity || 0)
    ? 18
    : -18
  return sizeHierarchy + opacityHierarchy
}

function photoPreservationScoreForCandidate (candidate, analysis) {
  if (candidate.scrimStyle === 'none') return analysis.avgDetail > 0.22 ? 22 : 14
  const opacity = candidate.scrimOpacity || 0
  if (opacity > 0.28) return -80
  return clamp(28 - opacity * 72, 6, 24)
}

function posterAnchorScoreForCandidate (candidate, analysis) {
  if (!isInstructionPosterText(candidate.text) && !isComplexNaturalScene(analysis)) return 0
  const box = candidate.titleRect || candidateBounds(candidate)
  const centerX = box.x + box.width / 2
  const upperPosterZone = box.y >= 0.13 && box.y <= 0.46
  const notEdgeHeader = box.x >= 0.12 && box.y >= 0.12
  const complexNatural = isComplexNaturalScene(analysis)
  let score = upperPosterZone && notEdgeHeader ? 26 : -24
  if (complexNatural && ['CalmInstructionPoster', 'MinimalPhrase'].includes(candidate.layoutType)) score += 24
  if (complexNatural && ['HeroSkyCenter', 'FullTypographicPoster'].includes(candidate.layoutType)) score -= 70
  if (centerX > 0.18 && centerX < 0.68) score += 12
  return score
}

function looksLikeCornerHeader (candidate) {
  const box = candidate.titleRect || candidateBounds(candidate)
  const metadataRects = [candidate.categoryRect, candidate.creditRect].filter(Boolean)
  const upperLeftTitle = box.x < 0.12 && box.y < 0.2
  const tightMetadata = metadataRects.some(rect => {
    const distance = Math.abs(rect.x - box.x) + Math.abs(rect.y - box.y)
    return distance < 0.18
  })
  return upperLeftTitle || (tightMetadata && box.y < 0.24 && box.x < 0.2)
}

function overDarkScrim (candidate, analysis) {
  if (candidate.scrimStyle === 'none') return false
  if ((candidate.scrimOpacity || 0) > 0.28) return true
  return analysis.avgBrightness < 118 && (candidate.scrimOpacity || 0) > 0.18
}

function isComplexNaturalScene (analysis) {
  return analysis.subject === 'subject-plant' ||
    (analysis.subject === 'subject-texture' && analysis.avgDetail > 0.22) ||
    (analysis.avgDetail > 0.24 && (analysis.foregroundDensityEstimate || 0) > 0.28)
}

function fallbackTypographyRegion (analysis) {
  return {
    x: 0.08,
    y: 0.16,
    width: 0.36,
    height: 0.28,
    area: 10,
    avgBrightness: analysis.avgBrightness || 128,
    avgTexture: analysis.avgDetail || 0.18,
    centerX: 0.26,
    centerY: 0.3
  }
}

function overlapsScreenUI (candidate, screenUI) {
  const box = candidateBounds(candidate)
  if (rectsOverlap(box, screenUI.bottom)) return true
  if (rectsOverlap(box, screenUI.topRight)) return true
  const edge = screenUI.edgePadding
  return box.x < edge || box.y < edge || box.x + box.width > 1 - edge || box.y + box.height > 1 - edge
}

function candidateBounds (candidate) {
  const width = candidate.maxWidth
  const height = candidateTitleHeight(candidate)
  const isRight = candidate.anchor.includes('right')
  const isLeft = candidate.anchor.includes('left')
  const isCentered = !isLeft && !isRight && (candidate.anchor.includes('center') || candidate.anchor === 'open-area')
  const x = isCentered ? candidate.x - width / 2 : isRight ? candidate.x - width : candidate.x
  const y = candidate.y - height / 2
  return { x, y, width, height }
}

function expandedTitleRect (rect, padding = 0.05) {
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2
  }
}

function rectsOverlap (a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

function imageFitForCandidate (candidate, analysis) {
  if (candidate.layoutType === 'CalmInstructionPoster') return isInstructionPosterText(candidate.text) ? 92 : 54
  if (candidate.layoutType === 'HeroSkyCenter') {
    return analysis.skyOrOpenAreaEstimate > 0.3
      ? 72 + analysis.skyOrOpenAreaEstimate * 36
      : 24 + analysis.openAreaRatio * 42
  }
  if (candidate.layoutType === 'HorizonOverlay') {
    return analysis.horizonEstimate.confidence > 0.36
      ? 74 + analysis.horizonEstimate.confidence * 32
      : 22 + analysis.horizonEstimate.confidence * 44
  }
  if (candidate.layoutType === 'LandscapeEditorial') {
    return analysis.subject === 'subject-landscape' && analysis.avgDetail < 0.24 ? 82 : 24
  }
  if (candidate.layoutType === 'DepthLockscreenPoster') {
    return foregroundDepthStrong(analysis) ? 168 : foregroundDepthLikely(analysis) ? 96 : 28
  }
  if (candidate.layoutType === 'MinimalPhrase') {
    if (['subject-plant', 'subject-city', 'subject-architecture'].includes(analysis.subject) || analysis.avgDetail > 0.24 || (analysis.subject === 'subject-texture' && analysis.avgDetail > 0.22)) return 96
    return 22 + analysis.avgDetail * 46
  }
  if (candidate.layoutType === 'FullTypographicPoster') {
    const cleanOpenBoost = analysis.openAreaRatio > 0.36 && analysis.skyOrOpenAreaEstimate < 0.24 && analysis.horizonEstimate.confidence < 0.32 ? 58 : 0
    return analysis.openAreaRatio * 62 + cleanOpenBoost
  }
  return 20
}

function readabilityForCandidate (candidate) {
  const texture = candidate.region?.avgTexture ?? 0.18
  return clamp(64 - texture * 150, 12, 64) + (candidate.scrimStyle === 'subtle-gradient' ? 8 : 0)
}

function posterImpactForCandidate (candidate, text) {
  const target = candidate.maxWidth
  const shortBoost = text.isShortWord || text.isShortCjk ? 18 : 0
  return clamp(target * 90 + candidate.fontSize / 7, 18, 84) + shortBoost
}

function calmnessForCandidate (candidate) {
  const heavyPenalty = candidate.fontWeight >= 700 && candidate.fontSize > 220 ? 8 : 0
  const subtitlePenalty = candidate.showInstruction ? 2 : 0
  return 36 - heavyPenalty - subtitlePenalty
}

function subjectOcclusionForCandidate (candidate, analysis) {
  const regionTexture = candidate.region?.avgTexture ?? 0.2
  const centerPenalty = candidate.x > 0.38 && candidate.x < 0.62 && candidate.y > 0.32 && candidate.y < 0.62 && analysis.avgDetail > 0.18 ? 22 : 0
  return regionTexture > 0.24 ? 24 : centerPenalty
}

function subjectOcclusionTooHigh (candidate, analysis) {
  const box = candidateBounds(candidate)
  const severeTexture = regionTextureAt(box, analysis) > 0.38
  if (candidate.layoutType === 'DepthLockscreenPoster') return severeTexture
  const instructionPoster = isInstructionPosterText(candidate.text)
  const calmInstructionTitleZone = instructionPoster && box.y < 0.34 && (analysis.avgDetail || 0) < 0.28
  const salientHit = (analysis.subjectAvoidanceRegions || analysis.salientRegions || []).some(region => {
    const rect = { x: region.x, y: region.y, width: region.width, height: region.height }
    return !calmInstructionTitleZone &&
      region.avgSalience > 0.34 &&
      rectIntersectionArea(box, rect) > Math.min(box.width * box.height * 0.18, 0.025)
  })
  const centralSubjectHit = ['subject-people', 'subject-object', 'subject-architecture', 'subject-city', 'subject-plant'].includes(analysis.subject) &&
    (analysis.subject !== 'subject-plant' || box.y > 0.32) &&
    rectIntersectionArea(box, { x: 0.34, y: 0.24, width: 0.32, height: 0.42 }) > Math.min(box.width * box.height * 0.18, 0.025)
  const lakeOrMountainCenterHit = analysis.subject === 'subject-landscape' &&
    instructionPoster &&
    rectIntersectionArea(box, { x: 0.32, y: 0.36, width: 0.36, height: 0.34 }) > Math.min(box.width * box.height * 0.22, 0.03)
  return severeTexture || salientHit || centralSubjectHit || lakeOrMountainCenterHit
}

function rectIntersectionArea (a, b) {
  const x = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
  const y = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))
  return x * y
}

function metadataComplexity (analysis) {
  return clamp(analysis.avgDetail * 2.2 + (analysis.foregroundDensityEstimate || 0) * 0.9, 0, 1)
}

function metadataLegibilityForCandidate (candidate, analysis) {
  return [candidate.instructionSlot, candidate.categorySlot, candidate.creditSlot]
    .filter(Boolean)
    .reduce((score, slot) => score + clamp(1 - regionTextureAt(slotRect(slot), analysis), 0, 1) * 8, 0)
}

function metadataClutterPenaltyForCandidate (candidate) {
  const count = candidate.metadataVisibleCount || 0
  return count > 2 ? (count - 2) * 8 : 0
}

function metadataUIBlockPenaltyForCandidate (candidate) {
  const slots = [candidate.instructionSlot, candidate.categorySlot, candidate.creditSlot].filter(Boolean)
  if (slots.length < 3) return 0
  const nearTitleCount = slots.filter(slot => slot.name === 'nearTitleSmall').length
  const stackedEdgeCount = slots.filter(slot => ['upperEdgeSubtle', 'quietCorner'].includes(slot.name)).length
  return nearTitleCount > 1 || stackedEdgeCount > 1 ? 18 : 0
}

function regionTextureAt (rect, analysis) {
  if (!analysis.cells?.length) return analysis.avgDetail || 0.18
  const minX = Math.max(Math.floor(rect.x * analysis.width), 0)
  const maxX = Math.min(Math.ceil((rect.x + rect.width) * analysis.width), analysis.width)
  const minY = Math.max(Math.floor(rect.y * analysis.height), 0)
  const maxY = Math.min(Math.ceil((rect.y + rect.height) * analysis.height), analysis.height)
  let total = 0
  let count = 0
  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      const cell = analysis.cells[y * analysis.width + x]
      if (!cell) continue
      total += cell.textureDensity
      count++
    }
  }
  return count ? total / count : analysis.avgDetail || 0.18
}

function fallbackPosterCandidate (text, analysis) {
  const region = fallbackTypographyRegion(analysis)
  const titleLines = titleLinesForCandidate(text.displayTitle, text, text.isCjk ? cjkPreferredLineCount(text) : 1)
  const instructionPoster = isInstructionPosterText(text)
  const fontSize = fitTextToWidth(text.displayTitle, {}, instructionPoster ? 0.32 : 0.36, titleLines.length || 1, {
    lineHeight: text.isCjk ? 1.16 : 1.12,
    titleLines
  })
  const candidate = {
    layoutType: 'MinimalPhrase',
    anchor: 'left-center',
    x: 0.1,
    y: 0.24,
    maxWidth: instructionPoster ? 0.32 : 0.36,
    maxLines: titleLines.length || 1,
    titleLines,
    fontFamily: 'poster-sans',
    fontWeight: instructionPoster ? 500 : 600,
    fontSize,
    lineHeight: text.isCjk ? 1.16 : 1.08,
    letterSpacing: text.isCjk ? 0 : 0.04,
    color: analysis.dominantPalette?.light || '#f2ead7',
    showInstruction: Boolean(text.instruction),
    showSubtitle: Boolean(text.instruction),
    subtitleStyle: {
      fontSize: Math.round(fontSize * 0.16),
      color: analysis.dominantPalette?.mutedLight || '#d7c9ad'
    },
    scrimStyle: 'subtle-gradient',
    scrimOpacity: 0.16,
    decorationLevel: 0,
    text,
    region
  }
  return withSecondaryInfoSlots(candidate, text, analysis, screenUISafeZones)
}

function compositionFromPosterCandidate (candidate, analysis) {
  const tone = candidate.region.avgBrightness > 156 ? 'tone-ink' : 'tone-paper'
  const schemeMap = {
    HeroSkyCenter: 'poster-scheme-sky',
    HorizonOverlay: 'poster-scheme-horizon',
    LandscapeEditorial: 'poster-scheme-editorial',
    DepthLockscreenPoster: 'poster-scheme-depth',
    CalmInstructionPoster: 'poster-scheme-calm',
    MinimalPhrase: 'poster-scheme-minimal',
    FullTypographicPoster: 'poster-scheme-full'
  }
  return {
    layout: 'poster-layout',
    layoutClass: `poster-${kebabCase(candidate.layoutType)}`,
    anchorClass: posterAnchorClass(candidate),
    depthClass: depthClassForCandidate(candidate, analysis),
    scheme: schemeMap[candidate.layoutType] || 'poster-scheme-minimal',
    typography: typographyClassForCandidate(candidate),
    subject: analysis.subject,
    focus: visualFocusFromAnalysis(analysis),
    tone,
    decor: candidate.decorationLevel > 0 ? 'decor-line' : 'decor-none',
    readableShade: candidate.scrimStyle !== 'none',
    palette: paletteFromPosterCandidate(candidate, analysis),
    poster: candidate,
    showInstruction: candidate.showInstruction,
    showSubtitle: candidate.showInstruction,
    showCategory: candidate.showCategory,
    showCredit: candidate.showCredit
  }
}

function posterAnchorClass (candidate) {
  if (candidate.anchor.includes('right')) return 'poster-anchor-right'
  if (candidate.anchor.includes('left')) return 'poster-anchor-left'
  return 'poster-anchor-center'
}

function depthClassForCandidate (candidate, analysis) {
  const depthLayoutTypes = ['HeroSkyCenter', 'HorizonOverlay', 'LandscapeEditorial', 'DepthLockscreenPoster', 'FullTypographicPoster']
  if (depthLayoutTypes.includes(candidate.layoutType) && foregroundDepthLikely(analysis)) return 'poster-depth-lockscreen'
  if (candidate.layoutType === 'CalmInstructionPoster' && foregroundDepthLikely(analysis) && candidate.y > 0.28) return 'poster-depth-lockscreen'
  return ''
}

function foregroundDepthLikely (analysis) {
  return analysis.subject === 'subject-plant' ||
    analysis.subject === 'subject-landscape' ||
    (analysis.foregroundDensityEstimate || 0) > 0.22 ||
    (analysis.avgDetail || 0) > 0.2
}

function foregroundDepthStrong (analysis) {
  return analysis.subject === 'subject-plant' ||
    (analysis.subject === 'subject-texture' && (analysis.avgDetail || 0) > 0.22) ||
    (analysis.foregroundDensityEstimate || 0) > 0.32
}

function typographyClassForCandidate (candidate) {
  if (candidate.fontFamily === 'poster-serif') return 'typography-serif'
  if (candidate.fontFamily === 'poster-cjk-modern') return 'typography-modern'
  if (candidate.layoutType === 'LandscapeEditorial') return 'typography-editorial'
  if (candidate.layoutType === 'DepthLockscreenPoster') return 'typography-modern'
  if (candidate.layoutType === 'CalmInstructionPoster') return 'typography-quiet'
  if (candidate.layoutType === 'MinimalPhrase') return 'typography-quiet'
  return 'typography-modern'
}

function visualFocusFromAnalysis (analysis) {
  const region = analysis.lowDetailCandidateRegions[0]
  if (!region) return 'focus-center'
  if (region.centerY < 0.32) return 'focus-top'
  if (region.centerY > 0.68) return 'focus-bottom'
  if (region.centerX < 0.38) return 'focus-left'
  if (region.centerX > 0.62) return 'focus-right'
  return 'focus-center'
}

function paletteFromPosterCandidate (candidate, analysis) {
  const hue = Number.isFinite(analysis.hue) ? analysis.hue : 44
  const shadow = candidate.region.avgBrightness > 156
    ? hsla(hue, 18, 96, 0.18)
    : hsla(hue, 24, 8, 0.32)
  return {
    '--wallpaper-accent': candidate.color,
    '--wallpaper-paper': analysis.dominantPalette.light,
    '--wallpaper-ink': analysis.dominantPalette.dark,
    '--wallpaper-muted': candidate.metadataColor || candidate.subtitleStyle?.color || analysis.dominantPalette.mutedLight,
    '--wallpaper-rule': candidate.color,
    '--wallpaper-shadow': shadow,
    '--poster-x': `${Math.round(candidate.x * 1000) / 10}%`,
    '--poster-y': `${Math.round(candidate.y * 1000) / 10}%`,
    '--poster-max-width': `${Math.round(candidate.maxWidth * 1000) / 10}vw`,
    '--poster-title-size': `${candidate.fontSize}px`,
    '--poster-depth-title-size': `${Math.round(candidate.fontSize * (candidate.text?.isCjk ? 1.1 : 1.45))}px`,
    '--poster-line-height': String(candidate.lineHeight),
    '--poster-letter-spacing': `${candidate.letterSpacing}em`,
    '--poster-subtitle-size': `${candidate.subtitleStyle?.fontSize || Math.round(candidate.fontSize * 0.16)}px`,
    '--poster-title-opacity': String(candidate.titleOpacity || 0.92),
    '--poster-instruction-opacity': String(candidate.instructionOpacity || 0.78),
    '--poster-instruction-color': candidate.subtitleStyle?.color || candidate.color,
    '--poster-metadata-size': `${Math.round(candidate.fontSize * 0.065)}px`,
    '--poster-metadata-opacity': String(candidate.metadataOpacity || 0.52),
    '--poster-metadata-color': candidate.metadataColor || candidate.subtitleStyle?.color || candidate.color,
    '--poster-metadata-max-width': `${Math.round((candidate.metadataMaxWidth || 0.22) * 1000) / 10}vw`,
    '--shade-x': `${Math.round(candidate.x * 1000) / 10}%`,
    '--shade-y': `${Math.round(candidate.y * 1000) / 10}%`,
    '--shade-angle': candidate.anchor.includes('right') ? '270deg' : '90deg',
    '--poster-scrim-opacity': String(clamp(candidate.scrimOpacity || 0, 0, 0.28)),
    '--poster-depth-start': `${Math.round(depthMaskStartForCandidate(candidate, analysis) * 1000) / 10}%`,
    '--poster-depth-softness': `${Math.round(depthMaskSoftnessForAnalysis(analysis) * 1000) / 10}%`
  }
}

function depthMaskStartForCandidate (candidate, analysis) {
  const horizon = analysis.horizonEstimate?.confidence > 0.2 ? analysis.horizonEstimate.y : 0.54
  const titleStart = Math.max((candidate.y || 0.48) - candidateTitleHeight(candidate) * 0.15, 0.34)
  return clamp(Math.min(horizon + 0.06, titleStart), 0.42, 0.7)
}

function depthMaskSoftnessForAnalysis (analysis) {
  return clamp(0.1 + (analysis.avgDetail || 0.12) * 0.28, 0.1, 0.18)
}

function applyWallpaperComposition (theme, composition) {
  theme.classList.add(...[
    composition.layout,
    composition.layoutClass,
    composition.anchorClass,
    composition.tone,
    composition.typography,
    composition.subject,
    composition.focus,
    composition.scheme,
    composition.decor,
    composition.depthClass
  ].filter(Boolean))
  theme.classList.toggle('needs-readable-shade', composition.readableShade)
  Object.entries(composition.palette || {}).forEach(([property, value]) => {
    theme.style.setProperty(property, value)
  })
}

function profileFromWallpaperColors (wallpaper = {}) {
  const colors = [wallpaper.colorA, wallpaper.colorB, wallpaper.colorC]
    .map(hexToRgb)
    .filter(Boolean)
  if (!colors.length) return { hue: 44, saturation: 0.24, avg: 138, edgeAverage: 0, uiRisk: 0, focusX: 0.5, focusY: 0.5 }

  const count = colors.length
  const rgb = colors.reduce((sum, color) => ({
    r: sum.r + color.r,
    g: sum.g + color.g,
    b: sum.b + color.b
  }), { r: 0, g: 0, b: 0 })
  const hsl = rgbToHsl(rgb.r / count, rgb.g / count, rgb.b / count)
  return {
    hue: hsl.h,
    saturation: hsl.s,
    avg: luminance(rgb.r / count, rgb.g / count, rgb.b / count),
    edgeAverage: 0,
    uiRisk: 0,
    focusX: 0.5,
    focusY: 0.5
  }
}

function subjectFromWallpaper (wallpaper = {}, profile = {}) {
  const text = `${wallpaper.keyword || ''} ${wallpaper.sourceName || ''}`.toLowerCase()
  if (/\b(person|people|portrait|face|woman|man|child|human|runner|athlete)\b/.test(text)) return 'subject-people'
  if (/\b(building|architecture|facade|bridge|tower|house|chapel|castle)\b/.test(text)) return 'subject-architecture'
  if (/\b(city|urban|street|skyline|traffic|downtown|road)\b/.test(text)) return 'subject-city'
  if (/\b(room|interior|desk|chair|window|kitchen|bedroom|office)\b/.test(text)) return 'subject-interior'
  if (/\b(tree|forest|leaf|plant|flower|grass|garden|botanical)\b/.test(text)) return 'subject-plant'
  if (/\b(object|cup|book|lamp|camera|table|product|still life)\b/.test(text)) return 'subject-object'
  if (/\b(texture|abstract|pattern|wall|surface|gradient)\b/.test(text)) return 'subject-texture'
  if (/\b(mountain|lake|ocean|sea|river|sky|cloud|beach|valley|landscape|nature|field|horizon)\b/.test(text)) return 'subject-landscape'
  if ((profile.edgeAverage || 0) > 0.24) return 'subject-texture'
  return 'subject-landscape'
}

function luminance (red, green, blue) {
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function rgbToHsl (red, green, blue) {
  const r = red / 255
  const g = green / 255
  const b = blue / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const lightness = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: lightness }

  const delta = max - min
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)
  let hue
  switch (max) {
    case r:
      hue = (g - b) / delta + (g < b ? 6 : 0)
      break
    case g:
      hue = (b - r) / delta + 2
      break
    default:
      hue = (r - g) / delta + 4
      break
  }
  return { h: hue * 60, s: saturation, l: lightness }
}

function hslToHex (hue, saturation, lightness) {
  const { r, g, b } = hslToRgb(hue, saturation, lightness)
  return `#${[r, g, b].map(value => Math.round(value).toString(16).padStart(2, '0')).join('')}`
}

function hslToRgb (hue, saturation, lightness) {
  const h = ((hue % 360) + 360) % 360 / 360
  if (saturation === 0) {
    const value = lightness * 255
    return { r: value, g: value, b: value }
  }
  const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation
  const p = 2 * lightness - q
  const hueToRgb = (t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  return {
    r: hueToRgb(h + 1 / 3) * 255,
    g: hueToRgb(h) * 255,
    b: hueToRgb(h - 1 / 3) * 255
  }
}

function hsla (hue, saturation, lightness, alpha) {
  return `hsla(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%, ${alpha})`
}

function hexToRgb (hex) {
  const match = String(hex || '').trim().match(/^#?([a-f0-9]{6})$/i)
  if (!match) return null
  const value = match[1]
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  }
}

function clamp (value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function stableIndex (value, modulo) {
  const text = String(value || Math.random())
  let hash = 0
  for (let index = 0; index < text.length; index++) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0
  }
  return hash % modulo
}

export {
  analyzeImageForTypography,
  animateWallpaperText,
  applyWallpaperTheme,
  buildPosterCopy,
  generatePosterLayoutCandidates,
  isDuplicateText,
  scoreAndSelectLayout,
  selectWallpaperEntranceVariant,
  supportFromText
}
