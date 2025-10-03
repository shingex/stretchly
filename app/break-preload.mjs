import {
  exposeBreaks,
  exposeI18next,
  exposeRuntime,
  exposeSettings,
  exposeStretchly,
  exposeUtils
} from './utils/context-bridge-exposers.js'

exposeBreaks('long')
exposeI18next()
exposeRuntime()
exposeSettings()
exposeStretchly()
exposeUtils()
