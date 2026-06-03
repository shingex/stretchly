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

const layoutCandidates = [
  { name: 'layout-left', x: 0, y: 0, width: 24, height: 45 },
  { name: 'layout-right', x: 56, y: 0, width: 24, height: 45 },
  { name: 'layout-bottom', x: 16, y: 30, width: 48, height: 13 },
  { name: 'layout-magazine-cover', x: 5, y: 3, width: 34, height: 27 },
  { name: 'layout-poster-stack', x: 44, y: 4, width: 31, height: 34 },
  { name: 'layout-side-note', x: 4, y: 9, width: 22, height: 28 },
  { name: 'layout-field-card', x: 48, y: 24, width: 27, height: 17 },
  { name: 'layout-caption-strip', x: 7, y: 34, width: 66, height: 9 }
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
  return support.length > 150 ? `${support.slice(0, 147).trim()}...` : support
}

function buildPosterCopy ({ ideaTitle, ideaText, wallpaper, sanitizer }) {
  const bodyText = textFromIdea(ideaText, sanitizer)
  const ideaTitleText = textFromIdea(ideaTitle, sanitizer)
  const title = ideaTitleText || titleFromWallpaper(wallpaper)
  const label = labelForWallpaper(wallpaper)
  const meta = metaForWallpaper(wallpaper)
  return {
    label,
    title,
    support: supportFromText(bodyText, title),
    meta: isDuplicateText(meta, label) ? '' : meta
  }
}

const wallpaperLayoutClasses = layoutCandidates.map(candidate => candidate.name)
const wallpaperToneClasses = ['tone-ink', 'tone-paper']

async function applyWallpaperTheme ({ ideaTitle, ideaText, options, sanitizer }) {
  if (options?.theme !== 'wallpaper') return

  document.body.classList.add('wallpaper-break')

  const theme = document.querySelector('.wallpaper-theme')
  const image = document.querySelector('.wallpaper-image')
  const generated = document.querySelector('.wallpaper-generated')
  const label = document.querySelector('.wallpaper-label')
  const title = document.querySelector('.wallpaper-title')
  const body = document.querySelector('.wallpaper-body')
  const meta = document.querySelector('.wallpaper-meta')
  if (!theme || !image || !generated || !label || !title || !body || !meta) return

  await renderWallpaper({
    theme,
    image,
    generated,
    label,
    title,
    body,
    meta,
    ideaTitle,
    ideaText,
    wallpaper: options.wallpaper || {},
    sanitizer
  })
  await appendSaveControl(options.wallpaper || {})
  await appendDislikeControl({
    ideaTitle,
    ideaText,
    sanitizer,
    elements: { theme, image, generated, label, title, body, meta }
  })
}

async function renderWallpaper ({ theme, image, generated, label, title, body, meta, ideaTitle, ideaText, wallpaper, sanitizer }) {
  resetWallpaperTheme(theme, image)

  const copy = buildPosterCopy({ ideaTitle, ideaText, wallpaper, sanitizer })
  label.textContent = copy.label
  title.textContent = copy.title
  body.textContent = copy.support
  meta.textContent = copy.meta
  body.hidden = !copy.support
  meta.hidden = !copy.meta

  if (wallpaper.fileUrl) {
    image.src = wallpaper.fileUrl
    image.style.objectPosition = wallpaper.position || 'center 50%'
    generated.style.setProperty('--wallpaper-color-a', wallpaper.colorA || '#c8d9cf')
    generated.style.setProperty('--wallpaper-color-b', wallpaper.colorB || '#e9d0aa')
    generated.style.setProperty('--wallpaper-color-c', wallpaper.colorC || '#334b45')
    try {
      await image.decode()
      theme.classList.add('has-image')
      const composition = await chooseComposition(image, wallpaper.id)
      theme.classList.add(composition.layout, composition.tone)
    } catch (_) {
      const composition = fallbackComposition(wallpaper.id)
      theme.classList.add(composition.layout, composition.tone)
    }
  } else {
    generated.style.setProperty('--wallpaper-color-a', wallpaper.colorA || '#c8d9cf')
    generated.style.setProperty('--wallpaper-color-b', wallpaper.colorB || '#e9d0aa')
    generated.style.setProperty('--wallpaper-color-c', wallpaper.colorC || '#334b45')
    const composition = fallbackComposition(wallpaper.id)
    theme.classList.add(composition.layout, composition.tone)
  }
  updateSaveControlVisibility(wallpaper)
}

function resetWallpaperTheme (theme, image) {
  theme.classList.remove('has-image', ...wallpaperLayoutClasses, ...wallpaperToneClasses)
  image.removeAttribute('src')
  image.style.objectPosition = ''
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
  if (document.querySelector('#save-wallpaper')) {
    updateSaveControlVisibility(wallpaper)
    return
  }
  const controls = document.querySelector('.breaks > :nth-child(2)')
  if (!controls) return
  const saveText = await window.i18next.t('break.saveImage')
  const savedText = await window.i18next.t('break.savedImage')
  const failedText = await window.i18next.t('break.saveImageFailed')
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
  button.onclick = async () => {
    button.disabled = true
    const savedPath = await window.electronApi.saveCurrentWallpaper()
    label.textContent = savedPath ? savedText : failedText
    setTimeout(() => {
      button.disabled = false
      label.textContent = saveText
    }, 1800)
  }
  controls.appendChild(button)
  updateSaveControlVisibility(wallpaper)
}

function updateSaveControlVisibility (wallpaper) {
  const button = document.querySelector('#save-wallpaper')
  if (!button) return
  button.hidden = !wallpaper.canSave
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
    const wallpaper = await window.electronApi.dislikeCurrentWallpaper()
    if (wallpaper) {
      await renderWallpaper({
        ...elements,
        ideaTitle,
        ideaText,
        wallpaper,
        sanitizer
      })
    }
    button.disabled = false
  }

  document.body.appendChild(button)
}

async function chooseComposition (image, seed) {
  const canvas = document.createElement('canvas')
  canvas.width = 80
  canvas.height = 45
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  const data = context.getImageData(0, 0, canvas.width, canvas.height).data
  const index = stableIndex(seed, layoutCandidates.length)
  const rotated = layoutCandidates.slice(index).concat(layoutCandidates.slice(0, index))
  const picked = rotated
    .map(zone => ({ ...zoneScore(data, canvas.width, zone), layout: zone.name }))
    .sort((a, b) => a.score - b.score)[0]
  return {
    layout: picked.layout,
    tone: picked.avg > 154 ? 'tone-ink' : 'tone-paper'
  }
}

function zoneScore (data, canvasWidth, zone) {
  const values = []
  for (let y = zone.y; y < zone.y + zone.height; y++) {
    for (let x = zone.x; x < zone.x + zone.width; x++) {
      const i = (y * canvasWidth + x) * 4
      values.push(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2])
    }
  }
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance = values.reduce((sum, value) => sum + Math.abs(value - avg), 0) / values.length
  const middleTonePenalty = Math.max(42 - Math.abs(avg - 150), 0) * 0.7
  return {
    avg,
    score: variance * 1.25 + middleTonePenalty
  }
}

function fallbackComposition (seed) {
  return {
    layout: layoutCandidates[stableIndex(seed || String(Date.now()), layoutCandidates.length)].name,
    tone: 'tone-paper'
  }
}

function stableIndex (value, modulo) {
  const text = String(value || Math.random())
  let hash = 0
  for (let index = 0; index < text.length; index++) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0
  }
  return hash % modulo
}

export { applyWallpaperTheme, buildPosterCopy, isDuplicateText, supportFromText }
