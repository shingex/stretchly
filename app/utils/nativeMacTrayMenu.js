export function serializeNativeTrayMenu (template) {
  const actions = new Map()
  let nextActionID = 0

  const serialize = items => items.map(item => {
    if (item.type === 'separator') return { type: 'separator' }
    const definition = {
      label: item.label || '',
      enabled: item.enabled !== false
    }
    if (Array.isArray(item.submenu)) {
      definition.submenu = serialize(item.submenu)
    } else if (typeof item.click === 'function') {
      definition.id = String(nextActionID++)
      actions.set(definition.id, item.click)
    }
    return definition
  })

  return { menu: serialize(template), actions }
}
