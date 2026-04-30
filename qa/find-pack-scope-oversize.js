const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')
const configPath = path.join(repoRoot, 'project.config.json')
const limitBytes = 200 * 1024

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function normalizeRelative(input) {
  return String(input || '')
    .replace(/\\/g, '/')
    .replace(/^\.?\//, '')
    .replace(/\/+$/, '')
}

function shouldIgnore(relPath, ignoreRules) {
  const normalized = relPath.replace(/\\/g, '/')
  for (const rule of ignoreRules) {
    if (!rule || typeof rule !== 'object') continue
    if (rule.type === 'folder') {
      const folder = normalizeRelative(rule.value)
      if (!folder) continue
      if (normalized === folder || normalized.startsWith(`${folder}/`)) {
        return true
      }
      continue
    }
    if (rule.type === 'suffix') {
      const suffix = String(rule.value || '')
      if (suffix && normalized.endsWith(suffix)) {
        return true
      }
    }
  }
  return false
}

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
    collector.push(fullPath)
  }
}

function formatKB(bytes) {
  return `${(bytes / 1024).toFixed(1)}KB`
}

function main() {
  const config = readJSON(configPath)
  const miniprogramRootRaw = config.miniprogramRoot || 'miniprogram/'
  const miniprogramRoot = path.resolve(repoRoot, miniprogramRootRaw)
  const ignoreRules = (config.packOptions && Array.isArray(config.packOptions.ignore) && config.packOptions.ignore) || []

  if (!fs.existsSync(miniprogramRoot)) {
    console.error(`miniprogramRoot 不存在: ${miniprogramRoot}`)
    process.exit(1)
  }

  const allFiles = []
  walk(miniprogramRoot, allFiles)

  const oversize = []
  for (const fullPath of allFiles) {
    const relFromRepo = path.relative(repoRoot, fullPath).replace(/\\/g, '/')
    if (shouldIgnore(relFromRepo, ignoreRules)) {
      continue
    }
    const stat = fs.statSync(fullPath)
    if (stat.size > limitBytes) {
      oversize.push({
        bytes: stat.size,
        relPath: relFromRepo,
      })
    }
  }

  oversize.sort((a, b) => b.bytes - a.bytes)

  console.log(`miniprogramRoot: ${miniprogramRootRaw}`)
  console.log(`ignore rules: ${ignoreRules.length}`)
  console.log('=== 理论进包范围内 >200KB 文件 ===')
  if (oversize.length === 0) {
    console.log('无')
    return
  }
  for (const item of oversize) {
    console.log(`${formatKB(item.bytes)}\t${item.relPath}`)
  }
}

main()
