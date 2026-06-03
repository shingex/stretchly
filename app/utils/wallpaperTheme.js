import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { execFile } from 'node:child_process'
import { get as httpsGet } from 'node:https'
import { basename, extname, join } from 'path'
import { DateTime } from 'luxon'
import { createApi } from 'unsplash-js'

const userAgent = 'Stretchly wallpaper theme'
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const directlyUsableWallpaperExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const convertibleWallpaperExtensions = new Set(['.heic', '.heif', '.tif', '.tiff'])
const cacheLimit = 24
const minRemoteImageLongEdge = 1600
const minRemoteImageShortEdge = 900
const maxRendererImagePixels = 10000000
const maxRendererImageLongEdge = 3600

const sourceOrder = ['unsplash', 'wikimedia', 'wallhaven', 'pexels', 'flickr']

const localWallpapers = [
  {
    id: 'local-dawn-meadow',
    source: 'generated',
    sourceName: 'Stretchly',
    sourceUrl: '',
    authorName: 'Stretchly',
    colorA: '#d8e8e0',
    colorB: '#f3c9a9',
    colorC: '#355c5a',
    motif: 'meadow',
    position: 'center 44%'
  },
  {
    id: 'local-fog-garden',
    source: 'generated',
    sourceName: 'Stretchly',
    sourceUrl: '',
    authorName: 'Stretchly',
    colorA: '#c9d7cd',
    colorB: '#edf0e5',
    colorC: '#536a5d',
    motif: 'garden',
    position: 'center 52%'
  },
  {
    id: 'local-evening-lake',
    source: 'generated',
    sourceName: 'Stretchly',
    sourceUrl: '',
    authorName: 'Stretchly',
    colorA: '#a9bdd2',
    colorB: '#e8d5bb',
    colorC: '#293f55',
    motif: 'lake',
    position: 'center 58%'
  }
]

function buildSearchContext ({ latitude, longitude, now = DateTime.local() }) {
  const month = now.month
  const hour = now.hour
  const season = month >= 3 && month <= 5
    ? 'spring'
    : month >= 6 && month <= 8
      ? 'summer'
      : month >= 9 && month <= 11
        ? 'autumn'
        : 'winter'
  const timeOfDay = hour >= 5 && hour < 11
    ? 'morning'
    : hour >= 11 && hour < 17
      ? 'afternoon'
      : hour >= 17 && hour < 21
        ? 'evening'
        : 'night'

  const context = {
    season,
    timeOfDay,
    weatherCode: null,
    temperature: null,
    weatherMood: timeOfDay === 'night' ? 'moonlight' : 'soft light',
    latitude,
    longitude
  }

  return context
}

async function hydrateWeatherContext (context, fetchImpl = fetch) {
  if (!Number.isFinite(context.latitude) || !Number.isFinite(context.longitude) ||
    (context.latitude === 0 && context.longitude === 0)) {
    return context
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(context.latitude))
  url.searchParams.set('longitude', String(context.longitude))
  url.searchParams.set('current', 'temperature_2m,weather_code,is_day')

  try {
    const data = await fetchJson(url, fetchImpl, 3500)
    if (!data) return context
    const current = data.current || {}
    context.weatherCode = current.weather_code
    context.temperature = current.temperature_2m
    context.weatherMood = weatherMood(current.weather_code, current.is_day)
  } catch (_) {
    return context
  }

  return context
}

function weatherMood (code, isDay = 1) {
  if (code == null) return isDay ? 'soft light' : 'moonlight'
  if ([45, 48].includes(code)) return 'mist'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  if (code >= 71 && code <= 77) return 'snow'
  if (code >= 95) return 'quiet storm'
  if (code <= 3) return isDay ? 'soft light' : 'moonlight'
  return 'calm weather'
}

function buildKeywordSet (context) {
  const seasonal = {
    spring: ['wildflowers', 'botanical garden', 'green meadow', 'soft forest'],
    summer: ['lake', 'shaded garden', 'coastal grass', 'mountain meadow'],
    autumn: ['quiet forest', 'golden leaves', 'misty valley', 'botanical path'],
    winter: ['snow forest', 'frosted grass', 'quiet lake', 'pine forest']
  }
  const weather = {
    mist: ['misty forest', 'foggy meadow', 'morning mist'],
    rain: ['rain garden', 'wet leaves', 'soft rain window'],
    snow: ['snow forest', 'winter meadow', 'frosted pine'],
    'quiet storm': ['cloudy mountain', 'dramatic sky nature'],
    moonlight: ['moonlit lake', 'night garden', 'quiet dusk'],
    'soft light': ['soft light landscape', 'sunlit grass', 'calm flowers'],
    'calm weather': ['quiet landscape', 'peaceful nature']
  }
  const base = [
    ...(seasonal[context.season] || seasonal.spring),
    ...(weather[context.weatherMood] || weather['calm weather']),
    `${context.timeOfDay} nature`,
    'relaxing landscape',
    'flowers no people'
  ]

  return [...new Set(base)]
}

function pickKeyword (keywords, recentIds = []) {
  const offset = recentIds.length % Math.max(keywords.length, 1)
  const index = Math.floor(Math.random() * keywords.length + offset) % keywords.length
  return keywords[index]
}

async function buildWallpaper ({
  cacheDir,
  saveDir,
  latitude,
  longitude,
  fetchImpl = fetch,
  now = DateTime.local(),
  recentIds = [],
  remoteSources = true,
  systemWallpaper = true,
  execFileImpl = execFile,
  unsplashAccessKey = '',
  unsplashRateLimited = false,
  onUnsplashRequest = () => {}
}) {
  mkdirSync(cacheDir, { recursive: true })
  mkdirSync(saveDir, { recursive: true })
  removeLegacyGeneratedSvgCache(cacheDir)
  removeLegacyOversizedImageCache(cacheDir)

  const context = await hydrateWeatherContext(buildSearchContext({ latitude, longitude, now }), fetchImpl)
  const keywords = buildKeywordSet(context)
  const keyword = pickKeyword(keywords, recentIds)

  if (remoteSources) {
    if (unsplashRateLimited) {
      const cachedAsset = cachedWallpaper(cacheDir, recentIds)
      if (cachedAsset) {
        return {
          ...cachedAsset,
          keyword,
          keywords,
          context,
          canSave: true
        }
      }
    } else {
      for (const source of sourceOrder) {
        const candidate = await fetchCandidate(source, keyword, recentIds, fetchImpl, {
          unsplashAccessKey,
          onUnsplashRequest
        })
        if (!candidate) continue
        const asset = await downloadCandidate(candidate, cacheDir, fetchImpl, execFileImpl)
        if (!asset) continue
        trimCache(cacheDir)
        return {
          ...asset,
          keyword,
          keywords,
          context,
          canSave: true
        }
      }
    }
  }

  if (systemWallpaper) {
    const systemAsset = await buildSystemWallpaper({ cacheDir, execFileImpl })
    if (systemAsset) {
      return {
        ...systemAsset,
        keyword,
        keywords,
        context,
        canSave: true
      }
    }
  }

  const fallback = localWallpapers[Math.floor(Math.random() * localWallpapers.length)]
  return {
    ...fallback,
    keyword,
    keywords,
    context,
    canSave: false
  }
}

async function fetchCandidate (source, keyword, recentIds, fetchImpl, options = {}) {
  try {
    switch (source) {
      case 'wikimedia':
        return await fetchWikimediaCandidate(keyword, recentIds, fetchImpl)
      case 'unsplash':
        return await fetchUnsplashCandidate(keyword, recentIds, fetchImpl, options.unsplashAccessKey, options.onUnsplashRequest)
      case 'pexels':
        return await fetchPexelsCandidate(keyword, recentIds, fetchImpl)
      case 'flickr':
        return await fetchFlickrCandidate(keyword, recentIds, fetchImpl)
      case 'wallhaven':
        return await fetchWallhavenCandidate(keyword, recentIds, fetchImpl)
      default:
        return null
    }
  } catch (_) {
    return null
  }
}

async function fetchWikimediaCandidate (keyword, recentIds, fetchImpl) {
  const url = new URL('https://commons.wikimedia.org/w/api.php')
  url.searchParams.set('action', 'query')
  url.searchParams.set('generator', 'search')
  url.searchParams.set('gsrsearch', `${keyword} landscape -person -people`)
  url.searchParams.set('gsrnamespace', '6')
  url.searchParams.set('gsrlimit', '12')
  url.searchParams.set('prop', 'imageinfo')
  url.searchParams.set('iiprop', 'url|extmetadata')
  url.searchParams.set('iiurlwidth', String(maxRendererImageLongEdge))
  url.searchParams.set('format', 'json')
  url.searchParams.set('origin', '*')

  const data = await fetchJson(url, fetchImpl, 8000)
  const pages = Object.values(data?.query?.pages || {})
  const photos = pages.map(page => {
    const info = page.imageinfo?.[0]
    const metadata = info?.extmetadata || {}
    const imageUrl = info?.thumburl || info?.url
    if (!imageUrl || !/\.(png|jpe?g|webp)(\?|$)/i.test(imageUrl)) return null
    return {
      id: `wikimedia-${page.pageid}`,
      source: 'wikimedia',
      sourceName: 'Wikimedia Commons',
      sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replaceAll(' ', '_'))}`,
      authorName: stripHtml(metadata.Artist?.value || metadata.Credit?.value || ''),
      imageUrl,
      position: 'center 50%'
    }
  }).filter(Boolean)

  return pickRemoteItem(photos, recentIds)
}

async function fetchUnsplashCandidate (keyword, recentIds, fetchImpl, accessKey, onRequest = () => {}) {
  if (!accessKey) return null
  if (!onRequest()) return null

  const unsplash = createApi({
    accessKey,
    fetch: fetchImpl
  })
  const result = await withTimeout(unsplash.search.getPhotos({
    query: keyword,
    page: 1,
    perPage: 20,
    orientation: 'landscape',
    contentFilter: 'high'
  }), 8000)
  if (result.errors || !result.response) return null

  const data = result.response
  const photo = pickRemoteItem(data.results, recentIds)
  if (!photo?.urls?.regular && !photo?.urls?.raw) return null

  return {
    id: `unsplash-${photo.id}`,
    source: 'unsplash',
    sourceName: 'Unsplash',
    sourceUrl: photo.links?.html || '',
    authorName: photo.user?.name || '',
    imageUrl: normalizeUnsplashImageUrl(photo.urls.raw || photo.urls.full || photo.urls.regular),
    position: 'center 48%'
  }
}

function withTimeout (promise, timeout) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Unsplash request timed out'))
    }, timeout)

    promise.then(result => {
      clearTimeout(timeoutId)
      resolve(result)
    }, error => {
      clearTimeout(timeoutId)
      reject(error)
    })
  })
}

async function fetchPexelsCandidate (keyword, recentIds, fetchImpl) {
  const url = new URL(`https://www.pexels.com/search/${encodeURIComponent(keyword)}/`)
  const html = await fetchText(url, fetchImpl, 6000, {
    headers: { 'user-agent': browserUserAgent(), accept: 'text/html' }
  })
  if (!html || html.includes('Just a moment')) return null
  const matches = [...html.matchAll(/https:\/\/images\.pexels\.com\/photos\/(\d+)\/[^"'\\\s]+/g)]
  const urls = matches.map(match => ({
    id: `pexels-${match[1]}`,
    imageUrl: normalizePexelsImageUrl(htmlDecode(match[0]).replace(/&amp;/g, '&'))
  }))
  const photo = pickRemoteItem(urls, recentIds)
  if (!photo) return null
  return {
    ...photo,
    source: 'pexels',
    sourceName: 'Pexels',
    sourceUrl: `https://www.pexels.com/search/${encodeURIComponent(keyword)}/`,
    authorName: '',
    position: 'center 50%'
  }
}

async function fetchFlickrCandidate (keyword, recentIds, fetchImpl) {
  const url = new URL('https://www.flickr.com/search/')
  url.searchParams.set('text', keyword)
  url.searchParams.set('license', '2,3,4,5,6,9')
  const html = await fetchText(url, fetchImpl, 7000, {
    headers: { 'user-agent': browserUserAgent(), accept: 'text/html' }
  })
  if (!html) return null
  const matches = [...html.matchAll(/https:\/\/live\.staticflickr\.com\/[^"'\\\s]+\.jpg/g)]
  const urls = [...new Set(matches.map(match => htmlDecode(match[0])))]
    .map(imageUrl => ({
      id: `flickr-${imageUrl.split('/').pop().replace(/\.jpg$/i, '')}`,
      imageUrl
    }))
  const photo = pickRemoteItem(urls, recentIds)
  if (!photo) return null
  return {
    ...photo,
    source: 'flickr',
    sourceName: 'Flickr CC',
    sourceUrl: url.toString(),
    authorName: '',
    position: 'center 50%'
  }
}

async function fetchWallhavenCandidate (keyword, recentIds, fetchImpl) {
  const url = new URL('https://wallhaven.cc/api/v1/search')
  url.searchParams.set('q', keyword)
  url.searchParams.set('categories', '100')
  url.searchParams.set('purity', '100')
  url.searchParams.set('sorting', 'random')
  url.searchParams.set('atleast', '1600x900')

  const data = await fetchJson(url, fetchImpl, 6000, {
    headers: { 'user-agent': userAgent }
  })
  if (!data) return null
  const photo = pickRemoteItem(data.data, recentIds)
  if (!photo?.path) return null

  return {
    id: `wallhaven-${photo.id}`,
    source: 'wallhaven',
    sourceName: 'Wallhaven',
    sourceUrl: photo.url || '',
    authorName: '',
    imageUrl: photo.path,
    position: 'center 50%'
  }
}

async function fetchJson (url, fetchImpl, timeout, options = {}) {
  try {
    const response = await fetchImpl(url, {
      ...options,
      headers: options.headers || { 'user-agent': userAgent },
      signal: AbortSignal.timeout(timeout)
    })
    if (response.ok) return await response.json()
  } catch (_) {}

  return await httpsJson(url, timeout)
}

async function fetchText (url, fetchImpl, timeout, options = {}) {
  try {
    const response = await fetchImpl(url, {
      ...options,
      headers: options.headers || { 'user-agent': userAgent },
      signal: AbortSignal.timeout(timeout)
    })
    if (response.ok) return await response.text()
  } catch (_) {}

  return await httpsText(url, timeout, options.headers)
}

function httpsText (url, timeout, headers = {}) {
  return new Promise(resolve => {
    const request = httpsGet(url, {
      headers: { 'user-agent': userAgent, ...headers },
      timeout: Math.max(timeout, 10000)
    }, response => {
      if (response.statusCode !== 200) {
        response.resume()
        resolve(null)
        return
      }
      const chunks = []
      response.on('data', chunk => chunks.push(chunk))
      response.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    })
    request.on('timeout', () => request.destroy())
    request.on('error', () => resolve(null))
  })
}

function httpsJson (url, timeout) {
  return new Promise(resolve => {
    const request = httpsGet(url, {
      headers: { 'user-agent': userAgent, accept: 'application/json' },
      timeout: Math.max(timeout, 10000)
    }, response => {
      if (response.statusCode !== 200) {
        response.resume()
        resolve(null)
        return
      }
      const chunks = []
      response.on('data', chunk => chunks.push(chunk))
      response.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
        } catch (_) {
          resolve(null)
        }
      })
    })
    request.on('timeout', () => request.destroy())
    request.on('error', () => resolve(null))
  })
}

function pickRemoteItem (items = [], recentIds = []) {
  const candidates = items.filter(item => item && !recentIds.includes(item.id))
  const list = candidates.length ? candidates : items
  if (!list.length) return null
  return list[Math.floor(Math.random() * list.length)]
}

async function downloadCandidate (candidate, cacheDir, fetchImpl, execFileImpl = execFile) {
  const response = await download(candidate.imageUrl, fetchImpl)
  if (!response) return null
  const type = response.contentType?.split(';')[0]?.toLowerCase()
  if (!allowedImageTypes.has(type)) return null
  const buffer = response.buffer
  if (!buffer || buffer.length < 1024) return null

  const extension = extensionForContentType(type, candidate.imageUrl)
  const filename = `${Date.now()}-${candidate.id.replace(/[^A-Za-z0-9_-]/g, '')}${extension}`
  const filePath = join(cacheDir, filename)
  writeFileSync(filePath, buffer)
  if (!isLargeEnoughImage(filePath)) {
    unlinkSync(filePath)
    return null
  }
  const preparedPath = await prepareRendererImage(filePath, type, execFileImpl)
  if (!preparedPath) return null

  return {
    ...candidate,
    filePath: preparedPath,
    filename: basename(preparedPath),
    fileUrl: 'file://' + preparedPath
  }
}

function normalizeUnsplashImageUrl (value) {
  try {
    const url = new URL(value)
    if (!url.hostname.endsWith('unsplash.com')) return value
    url.searchParams.set('auto', 'format')
    url.searchParams.set('fit', 'max')
    url.searchParams.set('w', String(maxRendererImageLongEdge))
    url.searchParams.delete('h')
    url.searchParams.delete('crop')
    return url.toString()
  } catch (_) {
    return value
  }
}

function normalizePexelsImageUrl (value) {
  try {
    const url = new URL(value)
    if (url.hostname !== 'images.pexels.com') return value
    url.searchParams.set('auto', 'compress')
    url.searchParams.set('cs', 'tinysrgb')
    url.searchParams.set('w', String(maxRendererImageLongEdge))
    url.searchParams.delete('h')
    url.searchParams.delete('fit')
    url.searchParams.delete('dpr')
    return url.toString()
  } catch (_) {
    return value
  }
}

function isLargeEnoughImage (filePath) {
  const dimensions = readImageDimensions(filePath)
  if (!dimensions) return false
  const longEdge = Math.max(dimensions.width, dimensions.height)
  const shortEdge = Math.min(dimensions.width, dimensions.height)
  return longEdge >= minRemoteImageLongEdge && shortEdge >= minRemoteImageShortEdge
}

function isRendererSafeImage (filePath) {
  const dimensions = readImageDimensions(filePath)
  if (!dimensions) return false
  const longEdge = Math.max(dimensions.width, dimensions.height)
  return dimensions.width * dimensions.height <= maxRendererImagePixels &&
    longEdge <= maxRendererImageLongEdge
}

async function prepareRendererImage (filePath, contentType, execFileImpl = execFile) {
  if (isRendererSafeImage(filePath)) return filePath
  if (process.platform !== 'darwin') {
    unlinkSync(filePath)
    return null
  }

  const ext = contentType === 'image/png'
    ? '.png'
    : contentType === 'image/webp'
      ? '.jpg'
      : extname(filePath)
  const outputPath = filePath.replace(/\.[^.]+$/, `-renderer${ext === '.jpeg' ? '.jpg' : ext}`)
  const converted = await resizeImageForRenderer(filePath, outputPath, execFileImpl)
  try {
    unlinkSync(filePath)
  } catch (_) {}
  if (!converted || !isRendererSafeImage(outputPath)) {
    try {
      unlinkSync(outputPath)
    } catch (_) {}
    return null
  }
  return outputPath
}

function resizeImageForRenderer (sourcePath, outputPath, execFileImpl = execFile) {
  return new Promise(resolve => {
    execFileImpl('sips', [
      '-Z',
      String(maxRendererImageLongEdge),
      sourcePath,
      '--out',
      outputPath
    ], { timeout: 8000 }, (error) => {
      resolve(!error && existsSync(outputPath) && statSync(outputPath).size >= 1024)
    })
  })
}

function readImageDimensions (filePath) {
  const buffer = readFileSync(filePath)
  if (buffer.length < 24) return null

  if (buffer[0] === 0x89 && buffer.toString('ascii', 1, 4) === 'PNG') {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20)
    }
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset++
        continue
      }
      const marker = buffer[offset + 1]
      const length = buffer.readUInt16BE(offset + 2)
      if (marker >= 0xc0 && marker <= 0xc3) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7)
        }
      }
      offset += 2 + length
    }
  }

  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return readWebpDimensions(buffer)
  }

  return null
}

function readWebpDimensions (buffer) {
  const type = buffer.toString('ascii', 12, 16)
  if (type === 'VP8X' && buffer.length >= 30) {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3)
    }
  }
  if (type === 'VP8 ' && buffer.length >= 30) {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff
    }
  }
  if (type === 'VP8L' && buffer.length >= 25) {
    const bits = buffer.readUInt32LE(21)
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1
    }
  }
  return null
}

async function download (url, fetchImpl) {
  try {
    const response = await fetchImpl(url, {
      headers: { 'user-agent': userAgent },
      signal: AbortSignal.timeout(10000)
    })
    if (response.ok) {
      return {
        contentType: response.headers.get('content-type'),
        buffer: Buffer.from(await response.arrayBuffer())
      }
    }
  } catch (_) {}

  return await httpsDownload(url)
}

function httpsDownload (url, redirects = 0) {
  return new Promise(resolve => {
    const request = httpsGet(url, {
      headers: { 'user-agent': userAgent },
      timeout: 15000
    }, response => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location && redirects < 3) {
        response.resume()
        resolve(httpsDownload(new URL(response.headers.location, url).toString(), redirects + 1))
        return
      }
      if (response.statusCode !== 200) {
        response.resume()
        resolve(null)
        return
      }
      const chunks = []
      response.on('data', chunk => chunks.push(chunk))
      response.on('end', () => {
        resolve({
          contentType: response.headers['content-type'],
          buffer: Buffer.concat(chunks)
        })
      })
    })
    request.on('timeout', () => request.destroy())
    request.on('error', () => resolve(null))
  })
}

function browserUserAgent () {
  return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari Stretchly'
}

function htmlDecode (value) {
  return String(value)
    .replaceAll('&amp;', '&')
    .replaceAll('\\u0026', '&')
}

function stripHtml (value) {
  return String(value).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function extensionForContentType (type, url) {
  if (type === 'image/png') return '.png'
  if (type === 'image/webp') return '.webp'
  const existing = extname(new URL(url).pathname).toLowerCase()
  return ['.jpg', '.jpeg'].includes(existing) ? existing : '.jpg'
}

function cachedWallpaper (cacheDir, recentIds = []) {
  const files = readdirSync(cacheDir)
    .filter(file => /\.(png|jpe?g|webp)$/i.test(file))
    .map(file => {
      const filePath = join(cacheDir, file)
      const stats = statSync(filePath)
      return {
        id: `cached-${file}`,
        filename: file,
        filePath,
        fileUrl: 'file://' + filePath,
        source: 'cache',
        sourceName: 'Cached wallpaper',
        sourceUrl: '',
        authorName: '',
        contentType: contentTypeForFile(filePath),
        position: 'center 50%',
        mtimeMs: stats.mtimeMs
      }
    })
    .filter(wallpaper => isRendererSafeImage(wallpaper.filePath))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
  const candidates = files.filter(file => !recentIds.includes(file.id))
  const list = candidates.length ? candidates : files
  if (!list.length) return null
  const { mtimeMs, ...wallpaper } = list[Math.floor(Math.random() * list.length)]
  return wallpaper
}

function contentTypeForFile (filePath) {
  const ext = extname(filePath).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.webp') return 'image/webp'
  return 'image/jpeg'
}

async function buildSystemWallpaper ({ cacheDir, execFileImpl = execFile }) {
  if (process.platform !== 'darwin') return null
  const sourcePath = await currentMacWallpaperPath(execFileImpl)
  return await cacheSystemWallpaper(sourcePath, cacheDir, execFileImpl)
}

function currentMacWallpaperPath (execFileImpl = execFile) {
  return new Promise(resolve => {
    execFileImpl('osascript', [
      '-e',
      'tell application "System Events" to get picture of current desktop'
    ], { timeout: 3000 }, (error, stdout) => {
      if (error) {
        resolve(null)
        return
      }
      resolve(String(stdout || '').trim() || null)
    })
  })
}

async function cacheSystemWallpaper (sourcePath, cacheDir, execFileImpl = execFile) {
  if (!sourcePath || !existsSync(sourcePath)) return null

  const sourceStats = statSync(sourcePath)
  if (!sourceStats.isFile() || sourceStats.size < 1024) return null

  mkdirSync(cacheDir, { recursive: true })
  const sourceExt = extname(sourcePath).toLowerCase()
  const id = `system-wallpaper-${Math.round(sourceStats.mtimeMs)}-${sourceStats.size}`
  const outputExt = directlyUsableWallpaperExtensions.has(sourceExt)
    ? (sourceExt === '.jpeg' ? '.jpg' : sourceExt)
    : '.jpg'
  const filename = `${Date.now()}-${id}${outputExt}`
  const filePath = join(cacheDir, filename)

  if (directlyUsableWallpaperExtensions.has(sourceExt)) {
    copyFileSync(sourcePath, filePath)
  } else if (convertibleWallpaperExtensions.has(sourceExt)) {
    const converted = await convertSystemWallpaper(sourcePath, filePath, execFileImpl)
    if (!converted) return null
  } else {
    return null
  }

  if (!existsSync(filePath) || statSync(filePath).size < 1024) {
    try {
      unlinkSync(filePath)
    } catch (_) {}
    return null
  }
  const preparedPath = await prepareRendererImage(filePath, outputExt === '.png'
    ? 'image/png'
    : outputExt === '.webp'
      ? 'image/webp'
      : 'image/jpeg', execFileImpl)
  if (!preparedPath) return null
  trimCache(cacheDir)
  return {
    id,
    source: 'system',
    sourceName: 'System wallpaper',
    sourceUrl: '',
    authorName: '',
    filePath: preparedPath,
    filename: basename(preparedPath),
    fileUrl: 'file://' + preparedPath,
    contentType: extname(preparedPath).toLowerCase() === '.png'
      ? 'image/png'
      : extname(preparedPath).toLowerCase() === '.webp'
        ? 'image/webp'
        : 'image/jpeg',
    position: 'center 50%'
  }
}

function convertSystemWallpaper (sourcePath, filePath, execFileImpl = execFile) {
  return new Promise(resolve => {
    execFileImpl('sips', [
      '-s',
      'format',
      'jpeg',
      sourcePath,
      '--out',
      filePath
    ], { timeout: 6000 }, (error) => {
      resolve(!error && existsSync(filePath) && statSync(filePath).size >= 1024)
    })
  })
}

function trimCache (cacheDir) {
  const files = readdirSync(cacheDir)
    .filter(file => /\.(png|jpe?g|webp)$/i.test(file))
    .map(file => {
      const filePath = join(cacheDir, file)
      return { filePath, mtimeMs: statSync(filePath).mtimeMs }
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs)

  files.slice(cacheLimit).forEach(file => {
    try {
      unlinkSync(file.filePath)
    } catch (_) {}
  })
}

function removeLegacyOversizedImageCache (cacheDir) {
  readdirSync(cacheDir)
    .filter(file => /\.(png|jpe?g|webp)$/i.test(file))
    .forEach(file => {
      const filePath = join(cacheDir, file)
      if (isRendererSafeImage(filePath)) return
      try {
        unlinkSync(filePath)
      } catch (_) {}
    })
}

function removeLegacyGeneratedSvgCache (cacheDir) {
  readdirSync(cacheDir)
    .filter(file => /^\d+-local-[A-Za-z0-9_-]+\.svg$/i.test(file))
    .forEach(file => {
      try {
        unlinkSync(join(cacheDir, file))
      } catch (_) {}
    })
}

function saveWallpaper (wallpaper, saveDir) {
  if (!wallpaper?.filePath || !existsSync(wallpaper.filePath)) return null
  mkdirSync(saveDir, { recursive: true })
  const sourceName = basename(wallpaper.filename || wallpaper.filePath)
  const target = join(saveDir, sourceName)
  copyFileSync(wallpaper.filePath, target)

  const sourceLine = [
    sourceName,
    wallpaper.sourceName || wallpaper.source || '',
    wallpaper.sourceUrl || '',
    wallpaper.authorName ? `by ${wallpaper.authorName}` : ''
  ].filter(Boolean).join(' | ')
  const sourcesPath = join(saveDir, 'SOURCES.md')
  const existing = existsSync(sourcesPath) ? readFileSync(sourcesPath, 'utf8') : ''
  writeFileSync(sourcesPath, `${existing}${sourceLine}\n`)

  return target
}

function migrateLegacySavedWallpaper (oldPath, newPath) {
  if (!oldPath || !newPath || oldPath === newPath) return
  if (existsSync(oldPath) && !existsSync(newPath)) {
    renameSync(oldPath, newPath)
  }
}

export {
  buildSearchContext,
  buildKeywordSet,
  buildWallpaper,
  cacheSystemWallpaper,
  fetchUnsplashCandidate,
  hydrateWeatherContext,
  isLargeEnoughImage,
  isRendererSafeImage,
  migrateLegacySavedWallpaper,
  normalizePexelsImageUrl,
  normalizeUnsplashImageUrl,
  prepareRendererImage,
  readImageDimensions,
  saveWallpaper,
  weatherMood
}
