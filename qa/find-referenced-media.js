const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')
const miniprogramRoot = path.join(repoRoot, 'miniprogram')
const limitBytes = 200 * 1024

const sourceExt = new Set(['.wxml', '.wxss', '.ts', '.js', '.json'])
const mediaExtPattern = /\.(png|jpe?g|gif|webp|bmp|svg|mp3|wav|ogg|aac|m4a|flac|amr|wma)(\?.*)?$/i

function walk(dirPath, collector) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, collector)
      continue
    }
    if (!entry.isFile()) continue
    const ext = path.extname(entry.name).toLowerCase()
    if (sourceExt.has(ext)) {
      collector.push(fullPath)
    }
  }
}

function collectStringCandidates(content) {
  const out = []
  const patterns = [
    /url\(\s*['"]?([^'")\s]+)['"]?\s*\)/gim,
    /['"`]([^'"`\n\r]+)['"`]/gm,
  ]
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(content)) !== null) {
      out.push(match[1])
    }
  }
  return out
}

function resolveCandidate(raw, sourceFile) {
  const value = String(raw || '').trim()
  if (!value) return null
  if (!mediaExtPattern.test(value)) return null
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('//')) return null
  if (value.startsWith('data:')) return null

  const clean = value.split('?')[0].split('#')[0]
  let absPath
  if (clean.startsWith('/')) {
    absPath = path.join(miniprogramRoot, clean.replace(/^\/+/, ''))
  } else {
    absPath = path.resolve(path.dirname(sourceFile), clean)
  }

  if (!absPath.startsWith(miniprogramRoot)) return null
  if (!fs.existsSync(absPath)) return null
  const stat = fs.statSync(absPath)
  if (!stat.isFile()) return null

  return absPath
}

function main() {
  if (!fs.existsSync(miniprogramRoot)) {
    console.error(`miniprogram 不存在: ${miniprogramRoot}`)
    process.exit(1)
  }

  const sourceFiles = []
  walk(miniprogramRoot, sourceFiles)

  const referenced = new Map()

  for (const sourceFile of sourceFiles) {
    const content = fs.readFileSync(sourceFile, 'utf8')
    const candidates = collectStringCandidates(content)
    for (const candidate of candidates) {
      const absPath = resolveCandidate(candidate, sourceFile)
      if (!absPath) continue
      const relPath = path.relative(repoRoot, absPath).replace(/\\/g, '/')
      const sourceRel = path.relative(repoRoot, sourceFile).replace(/\\/g, '/')
      const stat = fs.statSync(absPath)
      if (!referenced.has(relPath)) {
        referenced.set(relPath, {
          bytes: stat.size,
          refs: new Set([sourceRel]),
        })
      } else {
        referenced.get(relPath).refs.add(sourceRel)
      }
    }
  }

  const list = Array.from(referenced.entries())
    .map(([relPath, item]) => ({
      relPath,
      bytes: item.bytes,
      refs: item.refs,
    }))
    .sort((a, b) => b.bytes - a.bytes)

  console.log('=== 被源码引用的本地图片/音频（按体积降序）===')
  if (list.length === 0) {
    console.log('无')
  } else {
    for (const item of list.slice(0, 80)) {
      console.log(`${(item.bytes / 1024).toFixed(1)}KB\t${item.relPath}\trefs:${item.refs.size}`)
    }
  }

  const oversize = list.filter((item) => item.bytes > limitBytes)
  console.log('\n=== 被源码引用且 >200KB 的本地图片/音频 ===')
  if (oversize.length === 0) {
    console.log('无')
  } else {
    for (const item of oversize) {
      console.log(`${(item.bytes / 1024).toFixed(1)}KB\t${item.relPath}`)
      for (const ref of item.refs) {
        console.log(`  <- ${ref}`)
      }
    }
  }
}

main()
