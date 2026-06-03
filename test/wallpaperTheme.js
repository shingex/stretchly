import { should as chaiShould } from 'chai'
import { afterEach, beforeEach } from 'vitest'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'path'
import { DateTime } from 'luxon'
import {
  cacheSystemWallpaper,
  buildKeywordSet,
  buildSearchContext,
  buildWallpaper,
  fetchUnsplashCandidate,
  isLargeEnoughImage,
  isRendererSafeImage,
  normalizePexelsImageUrl,
  normalizeUnsplashImageUrl,
  prepareRendererImage,
  readImageDimensions,
  saveWallpaper,
  weatherMood
} from '../app/utils/wallpaperTheme'

const should = chaiShould()

describe('wallpaperTheme', () => {
  const testDir = join(__dirname, 'test-wallpapers')

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true })
  })

  it('builds seasonal time context', () => {
    const context = buildSearchContext({
      latitude: 31.2,
      longitude: 121.4,
      now: DateTime.fromISO('2026-05-31T08:30:00')
    })

    context.season.should.equal('spring')
    context.timeOfDay.should.equal('morning')
  })

  it('maps weather codes to quiet moods', () => {
    weatherMood(45, 1).should.equal('mist')
    weatherMood(61, 1).should.equal('rain')
    weatherMood(71, 1).should.equal('snow')
    weatherMood(1, 0).should.equal('moonlight')
  })

  it('creates soft nature keywords from context', () => {
    const keywords = buildKeywordSet({
      season: 'spring',
      timeOfDay: 'morning',
      weatherMood: 'mist'
    })

    keywords.should.contain('wildflowers')
    keywords.should.contain('misty forest')
    keywords.should.contain('morning nature')
  })

  it('saves current wallpaper and records source', () => {
    const source = join(testDir, 'cache.jpg')
    writeFileSync(source, 'image')

    const saved = saveWallpaper({
      filePath: source,
      filename: 'cache.jpg',
      sourceName: 'Unsplash',
      sourceUrl: 'https://example.com/photo',
      authorName: 'A. Photographer'
    }, join(testDir, 'saved'))

    existsSync(saved).should.equal(true)
    const sources = readFileSync(join(testDir, 'saved', 'SOURCES.md'), 'utf8')
    sources.should.contain('Unsplash')
    sources.should.contain('https://example.com/photo')
    sources.should.contain('A. Photographer')
  })

  it('uses an existing system wallpaper image as a cacheable fallback', async () => {
    const source = join(testDir, 'desktop.jpeg')
    writeFileSync(source, jpegWithDimensions(2400, 1600))

    const wallpaper = await cacheSystemWallpaper(source, join(testDir, 'cache'))

    existsSync(wallpaper.filePath).should.equal(true)
    wallpaper.source.should.equal('system')
    wallpaper.sourceName.should.equal('System wallpaper')
    wallpaper.contentType.should.equal('image/jpeg')
  })

  it('normalizes Pexels images to a wallpaper-sized URL', () => {
    const url = normalizePexelsImageUrl('https://images.pexels.com/photos/123/photo.jpeg?auto=compress&cs=tinysrgb&w=400&h=267&fit=crop')

    url.should.contain('w=3600')
    url.should.not.contain('h=267')
    url.should.not.contain('fit=crop')
  })

  it('normalizes Unsplash images to a renderer-sized URL', () => {
    const url = normalizeUnsplashImageUrl('https://images.unsplash.com/photo-123?ixid=x&w=9000&h=6000&crop=entropy')

    url.should.contain('w=3600')
    url.should.contain('fit=max')
    url.should.not.contain('h=6000')
    url.should.not.contain('crop=entropy')
  })

  it('uses the official Unsplash API when an access key is configured', async () => {
    const requests = []
    let requestCount = 0
    const fetchImpl = async (url, options) => {
      requests.push({ url: String(url), options })
      return new Response(JSON.stringify({
        total: 1,
        total_pages: 1,
        results: [{
          id: 'photo-123',
          urls: {
            raw: 'https://images.unsplash.com/photo-123?ixid=x&w=9000&h=6000&crop=entropy'
          },
          links: { html: 'https://unsplash.com/photos/photo-123' },
          user: { name: 'A. Photographer' }
        }]
      }), { status: 200, headers: { 'content-type': 'application/json' } })
    }

    const candidate = await fetchUnsplashCandidate('misty forest', [], fetchImpl, 'test-access-key', () => {
      requestCount++
      return true
    })

    candidate.source.should.equal('unsplash')
    candidate.sourceName.should.equal('Unsplash')
    candidate.authorName.should.equal('A. Photographer')
    candidate.imageUrl.should.contain('w=3600')
    requests[0].url.should.contain('https://api.unsplash.com/search/photos')
    requests[0].url.should.contain('query=misty+forest')
    requests[0].url.should.contain('content_filter=high')
    requests[0].options.headers.Authorization.should.equal('Client-ID test-access-key')
    requestCount.should.equal(1)
  })

  it('skips Unsplash when no access key is configured', async () => {
    let called = false
    const candidate = await fetchUnsplashCandidate('misty forest', [], async () => {
      called = true
    }, '')

    should.not.exist(candidate)
    called.should.equal(false)
  })

  it('does not call Unsplash when the request quota cannot be reserved', async () => {
    let called = false
    const candidate = await fetchUnsplashCandidate('misty forest', [], async () => {
      called = true
    }, 'test-access-key', () => false)

    should.not.exist(candidate)
    called.should.equal(false)
  })

  it('uses cached wallpapers instead of remote requests when Unsplash is rate limited', async () => {
    const cacheDir = join(testDir, 'cache')
    mkdirSync(cacheDir, { recursive: true })
    const cached = join(cacheDir, 'cached.jpg')
    writeFileSync(cached, jpegWithDimensions(2400, 1600))
    let called = false

    const wallpaper = await buildWallpaper({
      cacheDir,
      saveDir: join(testDir, 'saved'),
      remoteSources: true,
      systemWallpaper: false,
      unsplashAccessKey: 'test-access-key',
      unsplashRateLimited: true,
      fetchImpl: async () => {
        called = true
        throw new Error('remote fetch should not run')
      }
    })

    wallpaper.source.should.equal('cache')
    wallpaper.sourceName.should.equal('Cached wallpaper')
    wallpaper.filePath.should.equal(cached)
    called.should.equal(false)
  })

  it('rejects tiny remote images before caching them as wallpapers', () => {
    const tinyJpeg = join(testDir, 'tiny.jpg')
    writeFileSync(tinyJpeg, Buffer.from([
      0xff, 0xd8,
      0xff, 0xc0, 0x00, 0x11, 0x08,
      0x00, 0x71,
      0x00, 0x96,
      0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x00, 0x03, 0x11, 0x00,
      0x00, 0x00,
      0xff, 0xd9
    ]))

    readImageDimensions(tinyJpeg).should.deep.equal({ height: 113, width: 150 })
    isLargeEnoughImage(tinyJpeg).should.equal(false)
  })

  it('returns null when saving generated fallback wallpaper', () => {
    const saved = saveWallpaper({ filePath: '' }, join(testDir, 'saved'))
    should.not.exist(saved)
  })

  it('uses CSS fallback data instead of SVG files for generated wallpapers', async () => {
    const wallpaper = await buildWallpaper({
      cacheDir: join(testDir, 'cache'),
      saveDir: join(testDir, 'saved'),
      remoteSources: false,
      systemWallpaper: false
    })

    should.not.exist(wallpaper.fileUrl)
    wallpaper.canSave.should.equal(false)
    existsSync(join(testDir, 'cache', `${wallpaper.id}.svg`)).should.equal(false)
  })

  it('removes legacy generated SVG wallpaper cache entries', async () => {
    const cacheDir = join(testDir, 'cache')
    mkdirSync(cacheDir, { recursive: true })
    const legacySvg = join(cacheDir, '1780199476844-local-fog-garden.svg')
    writeFileSync(legacySvg, '<svg></svg>')

    await buildWallpaper({
      cacheDir,
      saveDir: join(testDir, 'saved'),
      remoteSources: false,
      systemWallpaper: false
    })

    existsSync(legacySvg).should.equal(false)
  })

  it('removes legacy oversized wallpaper cache entries when they cannot be resized', async () => {
    const cacheDir = join(testDir, 'cache')
    mkdirSync(cacheDir, { recursive: true })
    const oversized = join(cacheDir, 'oversized.jpg')
    writeFileSync(oversized, jpegWithDimensions(6048, 6048))

    await buildWallpaper({
      cacheDir,
      saveDir: join(testDir, 'saved'),
      remoteSources: false,
      systemWallpaper: false
    })

    existsSync(oversized).should.equal(false)
  })

  it('resizes oversized wallpaper images when a platform converter is available', async () => {
    const source = join(testDir, 'oversized.jpg')
    writeFileSync(source, jpegWithDimensions(6048, 6048))

    const resized = await prepareRendererImage(source, 'image/jpeg', (command, args, options, callback) => {
      const outputPath = args[args.length - 1]
      writeFileSync(outputPath, jpegWithDimensions(3000, 3000))
      callback(null)
    })

    existsSync(source).should.equal(false)
    existsSync(resized).should.equal(true)
    isRendererSafeImage(resized).should.equal(true)
  })
})

function jpegWithDimensions (width, height) {
  return Buffer.from([
    0xff, 0xd8,
    0xff, 0xc0, 0x00, 0x11, 0x08,
    (height >> 8) & 0xff,
    height & 0xff,
    (width >> 8) & 0xff,
    width & 0xff,
    0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x00, 0x03, 0x11, 0x00,
    ...Buffer.alloc(2048, 1),
    0xff, 0xd9
  ])
}
