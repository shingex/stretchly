import { describe, expect, it, vi } from 'vitest'
import { serializeNativeTrayMenu } from '../app/utils/nativeMacTrayMenu.js'

describe('nativeMacTrayMenu', () => {
  it('serializes labels, separators, disabled items and nested menus', () => {
    const action = vi.fn()
    const { menu } = serializeNativeTrayMenu([
      { label: 'Status', enabled: false },
      { type: 'separator' },
      { label: 'Pause', submenu: [{ label: 'Indefinitely', click: action }] }
    ])

    expect(menu).toEqual([
      { label: 'Status', enabled: false },
      { type: 'separator' },
      {
        label: 'Pause',
        enabled: true,
        submenu: [{ label: 'Indefinitely', enabled: true, id: '0' }]
      }
    ])
  })

  it('maps serialized action ids back to their click handlers', () => {
    const preferences = vi.fn()
    const quit = vi.fn()
    const { actions } = serializeNativeTrayMenu([
      { label: 'Preferences', click: preferences },
      { label: 'Quit', click: quit }
    ])

    actions.get('0')()
    actions.get('1')()

    expect(preferences).toHaveBeenCalledOnce()
    expect(quit).toHaveBeenCalledOnce()
  })
})
