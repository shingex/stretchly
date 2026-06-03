import { should as chaiShould } from 'chai'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'path'
import { backupInvalidJsonConfig, invalidConfigBackupPath } from '../app/utils/storeRecovery'

const should = chaiShould()

describe('storeRecovery', () => {
  const testDir = join(__dirname, 'test-store-recovery')
  const configPath = join(testDir, 'config.json')
  const now = new Date('2026-06-01T02:27:20.000Z')

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true })
  })

  it('leaves valid config files untouched', () => {
    writeFileSync(configPath, '{"enabled":true}')

    should.not.exist(backupInvalidJsonConfig(configPath, { now }))

    readFileSync(configPath, 'utf8').should.equal('{"enabled":true}')
  })

  it('backs up invalid JSON before electron-store clears it', () => {
    writeFileSync(configPath, '{"enabled":true "missingComma":true}')

    const backupPath = backupInvalidJsonConfig(configPath, { now })

    backupPath.should.equal(invalidConfigBackupPath(configPath, now))
    existsSync(backupPath).should.equal(true)
    readFileSync(backupPath, 'utf8').should.equal('{"enabled":true "missingComma":true}')
  })
})
