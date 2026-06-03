/* global document, window */

(function () {
  if (window.stretchly || window.settings || window.i18next) return

  const labels = {
    'preferences.title': 'Stretchly Preferences',
    'preferences.nav.settings': 'Settings',
    'preferences.nav.schedule': 'Schedule',
    'preferences.nav.theme': 'Theme',
    'preferences.nav.about': 'About',
    'preferences.nav.heart': 'Love Stretchly',
    'preferences.settings.openAtLogin': 'Start Stretchly automatically when logging in',
    'preferences.settings.showBreaksIn': 'Shows breaks in:',
    'preferences.settings.window': 'Window',
    'preferences.settings.fullscreen': 'Full screen',
    'preferences.settings.showIdeas': 'Show exercise tips during breaks',
    'preferences.settings.allScreens': 'Shows breaks on all monitors',
    'preferences.settings.monitorIdleTime': 'Monitor system idle time',
    'preferences.settings.monitorDnd': 'Show breaks even in Do Not Disturb mode',
    'preferences.settings.language': 'Select language:',
    'preferences.settings.restoreDefaults': 'Restore defaults',
    'preferences.schedule.miniBreaks': 'Mini breaks:',
    'preferences.schedule.miniBreaksInfo': 'Mini breaks are short breaks taken regularly to give you a chance to stretch and relax.',
    'preferences.schedule.enableMiniBreaks': 'Enable Mini breaks',
    'preferences.schedule.breakFor': 'Break for:',
    'preferences.schedule.every': 'Every:',
    'preferences.schedule.showNotificationBeforeMiniBreak': 'Show notification before Mini break starts',
    'preferences.schedule.enablePostponeMini': 'Enable postponement for Mini break',
    'preferences.schedule.longBreaks': 'Long breaks:',
    'preferences.schedule.longBreaksInfo': 'Long breaks are taken less regularly, but are of greater duration.',
    'preferences.schedule.enableLongBreaks': 'Enable Long breaks',
    'preferences.schedule.showNotificationBeforeLongBreak': 'Show notification before Long break starts',
    'preferences.schedule.enablePostponeLong': 'Enable postponement for Long break',
    'preferences.schedule.cantDisableBoth': 'Mini breaks and Long breaks cannot both be disabled.',
    'preferences.schedule.strictMode': 'Strict mode:',
    'preferences.schedule.strictModeInfo': 'Strict mode prevents you from skipping breaks and helps build discipline.',
    'preferences.schedule.enableStrictMini': 'Enable Strict mode for Mini breaks',
    'preferences.schedule.enableStrictLong': 'Enable Strict mode for Long breaks',
    'preferences.theme.appearance': 'Appearance:',
    'preferences.theme.greenClouds': 'Green clouds',
    'preferences.theme.autumnBeBlessed': 'Autumn be blessed',
    'preferences.theme.graphiteCrystal': 'Graphite crystal',
    'preferences.theme.coffeeKisses': 'Coffee kisses',
    'preferences.theme.morningSwim': 'Morning swim',
    'preferences.theme.transparentMode': 'Enable transparency',
    'preferences.theme.breakTheme': 'Break screen:',
    'preferences.theme.solidBreakTheme': 'Solid colour',
    'preferences.theme.wallpaperBreakTheme': 'Wallpaper magazine',
    'preferences.theme.sounds': 'Sounds:',
    'preferences.theme.enableSounds': 'Enable sounds',
    'preferences.theme.crystalGlass': 'Crystal glass',
    'preferences.theme.windChime': 'Wind chime',
    'preferences.theme.ticToc': 'Tic toc',
    'preferences.theme.reverie': 'Reverie',
    'preferences.theme.trayIcon': 'Menubar (Tray):',
    'preferences.theme.trayIconStyleDefault': 'Default',
    'preferences.theme.trayIconStyleTime': 'Time to break',
    'preferences.theme.trayIconStyleProgress': 'Progress to break',
    'preferences.theme.colour': 'Colour',
    'preferences.theme.monochrome': 'Monochrome',
    'preferences.theme.invertedMonochrome': 'Inverted Monochrome',
    'preferences.theme.snowWhite': 'Snow white',
    'preferences.about.tagline': 'The break time reminder app',
    'preferences.about.version': 'Version ',
    'preferences.about.latestVersion': 'Latest version ',
    'preferences.about.checkNewVersion': 'Automatically check for app updates',
    'preferences.about.learnMore': 'To learn more about Stretchly features, ',
    'preferences.about.ourWebsite': 'visit our website',
    'preferences.about.dot': '.',
    'preferences.about.developedBy': 'Developed by',
    'preferences.about.janH': 'Jan Hovancik',
    'preferences.about.designedBy': 'Icon and UI design by Colin Shanley',
    'preferences.heart.loveStretchly': 'Love your Stretchly?',
    'preferences.heart.desc1': 'Taking regular breaks when using a computer is important for your physical and mental well-being.',
    'preferences.heart.desc2': 'Stretchly is free. You can support ongoing development by becoming a contributor.',
    'preferences.heart.becomeContributor': 'Become a contributor',
    'preferences.heart.alreadyContributor': "I'm already a contributor",
    'preferences.heart.authenticateUsing': 'Authenticate using:',
    'preferences.heart.contributorPreferences': 'Contributor Preferences',
    'preferences.heart.syncPreferences': 'Sync Preferences'
  }

  const mockSettings = {
    allScreens: false,
    break: true,
    breakDuration: 300000,
    breakInterval: 5,
    breakNotification: true,
    breakPostpone: true,
    breakStrictMode: false,
    checkNewVersion: true,
    disableAppUpdateFeatures: false,
    fullscreen: false,
    hidePreferencesFileLocation: false,
    hideStrictModePreferences: false,
    ideas: true,
    language: 'en',
    longBreakAudio: 'crystal-glass',
    mainColor: '#478484',
    breakTheme: 'solid',
    microbreak: true,
    microbreakDuration: 20000,
    microbreakInterval: 600000,
    microbreakNotification: true,
    microbreakPostpone: true,
    microbreakStrictMode: false,
    monitorDnd: false,
    naturalBreaks: true,
    openAtLogin: true,
    silentNotifications: false,
    trayIconStyle: 'default',
    transparentMode: false,
    useMonochromeInvertedTrayIcon: false,
    useMonochromeTrayIcon: false
  }

  function humanizeI18nKey (key) {
    return key
      .split('.')
      .pop()
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/^./, character => character.toUpperCase())
  }

  function render () {
    document.querySelectorAll('[data-i18next]').forEach(element => {
      const key = element.dataset.i18next
      element.textContent = labels[key] || humanizeI18nKey(key)
    })

    document.title = labels['preferences.title']

    const defaults = [
      ['#language', 'en'],
      ['#trayIconStyle', 'default']
    ]
    defaults.forEach(([selector, value]) => {
      const element = document.querySelector(selector)
      if (element) element.value = value
    })

    const checked = [
      '#window',
      '#showIdeas',
      '#enableMiniBreaks',
      '#enableLongBreaks',
      '#greenClouds',
      '#enableSounds',
      '#crystalGlass',
      '#colour'
    ]
    checked.forEach(selector => {
      const element = document.querySelector(selector)
      if (element) element.checked = true
    })

    const version = document.querySelector('.version')
    const latestVersion = document.querySelector('.latestVersion')
    if (version) version.textContent = 'preview'
    if (latestVersion) latestVersion.textContent = 'preview'

    const ranges = {
      miniBreakFor: ['20 seconds', 20],
      miniBreakEvery: ['10 minutes', 10],
      longBreakFor: ['5 minutes', 5],
      longBreakEvery: ['60 minutes', 12]
    }
    Object.entries(ranges).forEach(([id, [label, value]]) => {
      const range = document.querySelector(`#${id}`)
      if (!range) return
      range.value = value
      range.closest('div').querySelector('output').textContent = label
    })

    document.querySelectorAll('.navigation a').forEach(link => {
      link.onclick = event => {
        event.preventDefault()
        const section = event.target.closest('[data-section]').getAttribute('data-section')
        showSection(section)
      }
    })

    showSection(new URLSearchParams(window.location.search).get('section') || 'settings')
  }

  function showSection (section) {
    const target = document.querySelector(`.navigation [data-section="${section}"]`)
    if (!target) return

    document.querySelectorAll('.navigation a').forEach(link => link.classList.remove('active'))
    target.classList.add('active')

    document.querySelectorAll('body > div:not(.custom-message)').forEach(element => {
      element.classList.toggle('hidden', !element.classList.contains(section))
    })
  }

  window.settings = {
    currentSettings: async () => mockSettings,
    saveSettings: async (key, value) => {
      mockSettings[key] = value
    }
  }

  window.stretchly = {
    getWindowBounds: async () => ({ width: 1040, height: 720 }),
    getVersion: async () => 'preview',
    onEnableContributorPreferences: () => {},
    onTranslate: () => {},
    openContributorAuth: () => {},
    openContributorPreferences: () => {},
    openSyncPreferences: () => {},
    playSound: () => {},
    restoreDefaults: () => {},
    setWindowSize: () => {},
    showDebug: async () => [
      '2026-05-30T10:00:00.000Z',
      '8 minutes',
      '2',
      '0',
      '/Users/preview/Library/Application Support/Stretchly/config.json',
      '/Users/preview/Library/Logs/Stretchly/main.log',
      false,
      '/Users/preview/Pictures/Stretchly'
    ]
  }

  window.i18next = {
    t: async (key, options) => {
      if (key === 'utils.minutes') return `${options.count} minutes`
      return labels[key] || humanizeI18nKey(key)
    }
  }

  window.utils = {
    formatUnitAndValue: async (unit, value) => `${value} ${unit}`
  }

  window.global = {
    getValue: async () => false
  }

  window.runtime = {
    chrome: async () => 'preview',
    electron: async () => 'preview',
    node: async () => 'preview',
    platform: async () => navigator.platform,
    windowsPortable: async () => false,
    windowsStore: async () => false
  }

  window.electronApi = {
    openExternal: () => {},
    openPath: () => {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render)
  } else {
    render()
  }
})()
