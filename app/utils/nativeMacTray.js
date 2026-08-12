import { EventEmitter } from 'node:events'
import { existsSync } from 'node:fs'
import { basename, join } from 'node:path'
import { spawn } from 'node:child_process'
import { app } from 'electron'
import log from 'electron-log/main.js'
import { serializeNativeTrayMenu } from './nativeMacTrayMenu.js'

export function nativeMacTrayHelperPath () {
  if (process.platform !== 'darwin') return null
  const helperPath = app.isPackaged
    ? join(process.resourcesPath, 'StretchlyTrayHelper')
    : join(app.getAppPath(), 'native', 'macos', 'build', 'StretchlyTrayHelper')
  return existsSync(helperPath) ? helperPath : null
}

export function nativeMacTrayIconPath (iconPath) {
  if (!app.isPackaged) return iconPath
  return iconPath.replace(`${join('app.asar', '')}/`, `${join('app.asar.unpacked', '')}/`)
}

export default class NativeMacTray extends EventEmitter {
  constructor (iconPath, helperPath = nativeMacTrayHelperPath()) {
    super()
    this.helperPath = helperPath
    this.iconPath = nativeMacTrayIconPath(iconPath)
    this.toolTip = ''
    this.menu = []
    this.actions = new Map()
    this.destroyed = false
    this.restartCount = 0
    this.outputBuffer = ''
    this.startHelper()
  }

  startHelper () {
    if (!this.helperPath) throw new Error('Native macOS tray helper is unavailable')
    this.child = spawn(this.helperPath, [], { stdio: ['pipe', 'pipe', 'pipe'] })
    this.child.stdout.setEncoding('utf8')
    this.child.stdout.on('data', chunk => this.handleOutput(chunk))
    this.child.stderr.setEncoding('utf8')
    this.child.stderr.on('data', chunk => log.warn(`Stretchly: native tray helper: ${chunk.trim()}`))
    this.child.on('spawn', () => {
      this.sendState()
      this.restartResetTimer = setTimeout(() => {
        this.restartCount = 0
      }, 5000)
    })
    this.child.on('exit', (code, signal) => {
      clearTimeout(this.restartResetTimer)
      this.child = null
      if (this.destroyed) return
      log.warn(`Stretchly: native tray helper exited (${code ?? signal})`)
      if (this.restartCount < 3) {
        this.restartCount += 1
        setTimeout(() => this.startHelper(), 250 * this.restartCount)
      }
    })
  }

  handleOutput (chunk) {
    this.outputBuffer += chunk
    const lines = this.outputBuffer.split('\n')
    this.outputBuffer = lines.pop()
    for (const line of lines) {
      if (!line) continue
      try {
        const event = JSON.parse(line)
        if (event.type === 'action') this.actions.get(event.id)?.()
        if (event.type === 'double-click') this.emit('double-click')
      } catch (error) {
        log.warn('Stretchly: invalid native tray helper response', error)
      }
    }
  }

  setImage (iconPath) {
    this.iconPath = nativeMacTrayIconPath(iconPath)
    this.sendState()
  }

  setToolTip (toolTip) {
    this.toolTip = toolTip
    this.sendState()
  }

  setMenuTemplate (template) {
    const { menu, actions } = serializeNativeTrayMenu(template)
    this.menu = menu
    this.actions = actions
    this.sendState()
  }

  sendState () {
    if (!this.child?.stdin?.writable) return
    const payload = {
      type: 'update',
      iconPath: this.iconPath,
      template: basename(this.iconPath).includes('Template'),
      toolTip: this.toolTip,
      menu: this.menu
    }
    this.child.stdin.write(`${JSON.stringify(payload)}\n`)
  }

  destroy () {
    this.destroyed = true
    clearTimeout(this.restartResetTimer)
    if (this.child?.stdin?.writable) {
      this.child.stdin.write(`${JSON.stringify({ type: 'destroy' })}\n`)
      this.child.stdin.end()
    }
    this.child = null
    this.actions.clear()
  }
}
