const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')
const limitBytes = 200 * 1024

const assetExt = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.bmp',
  '.svg',
  '.mp3',
  '.wav',
  '.ogg',
  '.aac',
  '.m4a',
  '.flac',
  '.amr',
  '.wma',
])

const skipDirs = new Set(['.git', 'node_modules', 'dist'])
const knownExt = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.bmp',
  '.svg',
  '.mp3',
  '.wav',
  '.ogg',
  '.aac',
  '.m4a',
  '.flac',
  '.amr',
  '.wma',
])

function walk(dirPath, collector) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.git') {
      continue
    }
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue
      walk(fullPath, collector)
      continue
    }
    if (!entry.isFile()) continue
    const ext = path.extname(entry.name).toLowerCase()
    if (!assetExt.has(ext)) continue
    const stat = fs.statSync(fullPath)
    if (stat.size > limitBytes) {
      collector.push({
        bytes: stat.size,
        ext,
        relPath: path.relative(repoRoot, fullPath),
      })
    }
  }
}

function collectAllOversizeFiles(rootDir) {
  const result = []
  const stack = [rootDir]
  while (stack.length > 0) {
    const current = stack.pop()
    const entries = fs.readdirSync(current, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        if (skipDirs.has(entry.name)) continue
        stack.push(fullPath)
        continue
      }
      if (!entry.isFile()) continue
      const stat = fs.statSync(fullPath)
      if (stat.size > limitBytes) {
        result.push({
          bytes: stat.size,
          relPath: path.relative(repoRoot, fullPath),
        })
      }
    }
  }
  return result.sort((a, b) => b.bytes - a.bytes)
}

function detectMagicType(filePath) {
  let buffer
  try {
    const fd = fs.openSync(filePath, 'r')
    buffer = Buffer.alloc(32)
    fs.readSync(fd, buffer, 0, 32, 0)
    fs.closeSync(fd)
  } catch (_error) {
    return ''
  }

  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png'
  }

  // JPG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpg'
  }

  // GIF
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return 'gif'
  }

  // WEBP: RIFF....WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'webp'
  }

  // WAV: RIFF....WAVE
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x41 &&
    buffer[10] === 0x56 &&
    buffer[11] === 0x45
  ) {
    return 'wav'
  }

  // MP3 ID3
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
    return 'mp3'
  }

  // MP3 frame sync
  if (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0) {
    return 'mp3'
  }

  return ''
}

function collectDisguisedMediaInMiniprogram(miniprogramDir) {
  const result = []
  const stack = [miniprogramDir]
  while (stack.length > 0) {
    const current = stack.pop()
    const entries = fs.readdirSync(current, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        if (skipDirs.has(entry.name)) continue
        stack.push(fullPath)
        continue
      }
      if (!entry.isFile()) continue
      const ext = path.extname(entry.name).toLowerCase()
      if (knownExt.has(ext)) continue
      const stat = fs.statSync(fullPath)
      if (stat.size <= limitBytes) continue
      const magic = detectMagicType(fullPath)
      if (!magic) continue
      result.push({
        bytes: stat.size,
        magic,
        relPath: path.relative(repoRoot, fullPath),
      })
    }
  }
  return result.sort((a, b) => b.bytes - a.bytes)
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)}KB`
}

function main() {
  const miniprogramRoot = path.join(repoRoot, 'miniprogram')
  const oversizeAssets = []
  walk(miniprogramRoot, oversizeAssets)
  oversizeAssets.sort((a, b) => b.bytes - a.bytes)

  console.log('=== miniprogram 内 >200KB 图片/音频 ===')
  if (oversizeAssets.length === 0) {
    console.log('无')
  } else {
    for (const item of oversizeAssets) {
      console.log(`${formatBytes(item.bytes)}\t${item.relPath}`)
    }
  }

  console.log('\n=== miniprogram 内 >200KB 伪装图片/音频（按文件头识别）===')
  const disguised = collectDisguisedMediaInMiniprogram(miniprogramRoot)
  if (disguised.length === 0) {
    console.log('无')
  } else {
    for (const item of disguised) {
      console.log(`${formatBytes(item.bytes)}\t${item.magic}\t${item.relPath}`)
    }
  }

  console.log('\n=== 全项目内 >200KB 任意文件（便于定位误报） ===')
  const allOversize = collectAllOversizeFiles(repoRoot)
  if (allOversize.length === 0) {
    console.log('无')
    return
  }
  for (const item of allOversize) {
    console.log(`${formatBytes(item.bytes)}\t${item.relPath}`)
  }
}

main()
