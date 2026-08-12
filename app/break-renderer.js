import HtmlTranslate from './utils/htmlTranslate.js'
import applyBreakHealthEffect from './utils/breakHealthEffect.js'
import { animateWallpaperText, applyWallpaperTheme } from './utils/wallpaperBreakRenderer.js'
import { scheduleTextEntrance } from './utils/textEntranceAnimation.js'
import createRunOnce from './utils/runOnce.js'
import './platform.js'

window.onload = async (event) => {
  const [idea, started, duration, strictMode, postpone,
    postponePercent, backgroundColor, danger, breakHealthMode, themeOptions] = await window.breaks.sendBreakData()

  const mainColor = await window.settings.get('mainColor')
  const isWallpaperTheme = themeOptions?.theme === 'wallpaper'
  const isSolidTheme = themeOptions?.theme === 'solid'

  new HtmlTranslate(document).translate()
  applyBreakHealthEffect(danger, breakHealthMode, isSolidTheme ? mainColor : null)

  document.ondragover = event =>
    event.preventDefault()

  document.ondrop = event =>
    event.preventDefault()

  let manualAwaiting = false
  const progress = document.querySelector('#progress')
  const progressTime = document.querySelector('#progress-time')
  const postponeElement = document.querySelector('#postpone')
  const closeElement = document.querySelector('#close')
  const manualFinishElement = document.querySelector('#finish')
  const locale = await window.settings.get('language')
  const showCurrentTime = await window.settings.get('currentTimeInBreaks')
  const currentTimeElement = showCurrentTime ? document.querySelector('.breaks > :last-child') : null
  const runOnce = createRunOnce()

  document.querySelector('#close').onclick = runOnce(() => window.breaks.finishBreak(manualAwaiting))

  document.querySelector('#postpone').onclick = runOnce(() => window.breaks.postponeBreak())

  manualFinishElement.onclick = runOnce(() => window.breaks.finishBreak(manualAwaiting))

  document.querySelector('.break-idea').innerHTML = window.breaks.sanitizeIdea(idea[0])
  document.querySelector('.break-text').innerHTML = window.breaks.sanitizeIdea(idea[1])

  const applyWallpaper = (options, animate = false) => applyWallpaperTheme({
    ideaTitle: idea[0],
    ideaText: idea[1],
    options,
    sanitizer: window.breaks.sanitizeIdea,
    animate,
    prepareText: !animate
  })

  const hasInitialWallpaper = isWallpaperTheme && themeOptions?.wallpaper
  if (isWallpaperTheme && !hasInitialWallpaper) {
    document.body.classList.add('wallpaper-break')
  }

  const wallpaperReady = hasInitialWallpaper
    ? applyWallpaper(themeOptions).catch(error => {
      console.error('Stretchly: wallpaper break theme failed', error)
      document.body.classList.remove('wallpaper-break')
    })
    : Promise.resolve()

  window.breaks.onWallpaperChanged(options => {
    applyWallpaper({
      ...options,
      theme: 'wallpaper'
    }, true).catch(error => {
      console.error('Stretchly: wallpaper break update failed', error)
    })
  })

  const currentWallpaperState = await window.breaks.getWallpaperState()
  if (currentWallpaperState?.wallpaper) {
    await applyWallpaper({
      ...currentWallpaperState,
      theme: 'wallpaper'
    }, false).catch(error => {
      console.error('Stretchly: wallpaper break state restore failed', error)
    })
  }

  document.querySelectorAll('.break-idea a, .break-text a').forEach(a => {
    a.onclick = (event) => {
      event.preventDefault()
      window.electronApi.openExternal(a.href)
    }
  })

  document.querySelectorAll('.break-idea img, .break-text img').forEach(async img => {
    const src = img.getAttribute('src') || ''
    const resolved = await window.electronApi.resolveLocalImage(src)
    if (resolved) {
      img.src = resolved
    } else {
      img.remove()
    }
  })

  if (isSolidTheme) {
    document.body.classList.add(mainColor.substring(1))
    document.body.style.backgroundColor = backgroundColor
  }

  document.querySelectorAll('.tiptext').forEach(async tt => {
    const keyboardShortcut = await window.settings.get('endBreakShortcut')
    tt.innerHTML = window.utils.formatKeyboardShortcut(keyboardShortcut)
  })

  if (isWallpaperTheme) {
    moveWallpaperProgressTime(progressTime)
    await configureWallpaperAction(postponeElement, 'break.postpone')
    await configureWallpaperAction(closeElement, 'break.skip')
    await configureWallpaperAction(manualFinishElement, 'break.finish')
  }

  let lastShownSecond = null
  setInterval(async () => {
    if (showCurrentTime) {
      currentTimeElement.innerHTML = (new Date()).toLocaleTimeString()
    }
    const now = Date.now()
    const passed = now - started
    const currentSecond = Math.floor(passed / 1000)
    const secondChanged = currentSecond !== lastShownSecond
    lastShownSecond = currentSecond
    if (!manualAwaiting) {
      if (passed < duration) {
        const passedPercent = passed / duration * 100
        if (window.utils.canPostpone(postpone, passedPercent, postponePercent)) {
          postponeElement.classList.remove('hidden')
        } else {
          postponeElement.classList.add('hidden')
        }
        if (window.utils.canSkip(strictMode, postpone, passedPercent, postponePercent)) {
          closeElement.classList.remove('hidden')
        } else {
          closeElement.classList.add('hidden')
        }
        progress.value = (100 - passedPercent) * progress.max / 100
        if (secondChanged) {
          progressTime.innerHTML = await window.utils.formatTimeRemaining(duration - passed, locale)
        }
      }
    } else {
      if (secondChanged) {
        progressTime.innerHTML = await window.utils.formatElapsedDuration(passed, locale)
      }
    }
  }, 100)

  window.breaks.onEnterManualAwait(async (which) => {
    if (which !== 'break' || manualAwaiting) return
    manualAwaiting = true
    progress.value = 0
    progressTime.classList.remove('hidden')
    postponeElement.classList.add('hidden')
    closeElement.classList.add('hidden')
    manualFinishElement.classList.remove('hidden')
    progressTime.innerHTML = await window.utils.formatElapsedDuration(Date.now() - started, locale)
  })

  await window.breaks.signalLoaded()
  await wallpaperReady
  if (isWallpaperTheme) {
    animateWallpaperText({ variant: themeOptions.wallpaperAnimationVariant, scheduled: true })
  } else {
    scheduleTextEntrance([
      document.querySelector('.break-idea'),
      document.querySelector('.break-text')
    ])
  }
}

function moveWallpaperProgressTime (progressTime) {
  const controls = document.querySelector('.breaks > :nth-child(2)')
  if (!controls || !progressTime || progressTime.parentElement === controls) return
  controls.prepend(progressTime)
}

async function configureWallpaperAction (element, labelKey) {
  if (!element) return
  const label = await window.i18next.t(labelKey)
  element.setAttribute('aria-label', label)
  element.setAttribute('title', label)
  const tip = element.querySelector('.tiptext')
  if (tip) tip.textContent = label
}
