import {
  exposeBreaks,
  exposeI18next,
  exposeRuntime,
  exposeSettings,
  exposeStretchly,
  exposeUtils
} from './utils/context-bridge-exposers.js'

exposeBreaks('mini')
exposeI18next()
exposeRuntime()
exposeSettings()
exposeStretchly()
exposeUtils()
