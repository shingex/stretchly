import { copyFileSync, existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'path'

function invalidConfigBackupPath (configPath, now = new Date()) {
  const stamp = now.toISOString()
    .replaceAll(':', '')
    .replace(/\.\d{3}Z$/, 'Z')
  return join(dirname(configPath), `config.invalid-${stamp}.json`)
}

function backupInvalidJsonConfig (configPath, { log, now = new Date() } = {}) {
  if (!existsSync(configPath)) {
    return null
  }

  try {
    JSON.parse(readFileSync(configPath, 'utf8'))
    return null
  } catch (error) {
    if (error?.name !== 'SyntaxError') {
      throw error
    }

    const backupPath = invalidConfigBackupPath(configPath, now)
    copyFileSync(configPath, backupPath)
    log?.warn?.(`Stretchly: invalid preferences file backed up to ${backupPath}`, error)
    return backupPath
  }
}

export {
  backupInvalidJsonConfig,
  invalidConfigBackupPath
}
