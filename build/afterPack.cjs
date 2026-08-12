const { execFileSync } = require('node:child_process')
const { join } = require('node:path')
const { Arch } = require('builder-util')

module.exports = async function afterPack (context) {
  if (context.electronPlatformName !== 'darwin') return

  const target = context.arch === Arch.arm64
    ? 'arm64-apple-macos12.0'
    : 'x86_64-apple-macos12.0'
  const source = join(context.packager.projectDir, 'native', 'macos', 'StretchlyTrayHelper.swift')
  const output = join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`, 'Contents', 'Resources', 'StretchlyTrayHelper')

  execFileSync('swiftc', ['-O', '-target', target, source, '-o', output], { stdio: 'inherit' })
}
