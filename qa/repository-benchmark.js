const path = require('path')
const os = require('os')
const fs = require('fs')

function setupWx(tag) {
  const dataRoot = path.join(os.tmpdir(), `mimama-qa-${tag}`)
  fs.rmSync(dataRoot, { recursive: true, force: true })
  fs.mkdirSync(dataRoot, { recursive: true })
  const storageMap = new Map()

  global.wx = {
    env: { USER_DATA_PATH: dataRoot },
    getFileSystemManager() {
      return {
        writeFileSync(filePath, content, encoding) {
          fs.mkdirSync(path.dirname(filePath), { recursive: true })
          fs.writeFileSync(filePath, content, encoding || 'utf8')
        },
        readFileSync(filePath, encoding) {
          return fs.readFileSync(filePath, encoding || 'utf8')
        },
        statSync(filePath) {
          return fs.statSync(filePath)
        },
        accessSync(filePath) {
          fs.accessSync(filePath)
        },
        mkdirSync(dirPath, recursive) {
          fs.mkdirSync(dirPath, { recursive: !!recursive })
        },
        unlinkSync(filePath) {
          fs.unlinkSync(filePath)
        },
      }
    },
    getStorageSync(key) {
      return storageMap.has(key) ? storageMap.get(key) : ''
    },
    setStorageSync(key, value) {
      storageMap.set(key, value)
    },
    removeStorageSync(key) {
      storageMap.delete(key)
    },
    arrayBufferToBase64(buffer) {
      return Buffer.from(buffer).toString('base64')
    },
    base64ToArrayBuffer(value) {
      const buf = Buffer.from(value, 'base64')
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
    },
  }
}

function hrms(start) {
  return Number((process.hrtime.bigint() - start) / 1000000n)
}

async function runCase(total) {
  setupWx(`n${total}`)
  delete require.cache[require.resolve('/tmp/mimama-js/services/vault-repository.js')]
  const { getVaultRepository } = require('/tmp/mimama-js/services/vault-repository.js')
  const repo = getVaultRepository()

  const pin = '123456'
  await repo.initialize(pin)
  await repo.verifyPasscode(pin)

  const tInsert = process.hrtime.bigint()
  for (let i = 0; i < total; i += 1) {
    await repo.upsertItem({
      title: `账号-${i}-mail`,
      account: `u_${i}@mail.com`,
      password: `p_${i}`,
      note: `n_${i}`,
    })
  }
  const insertMs = hrms(tInsert)

  const tList = process.hrtime.bigint()
  const list = await repo.listItems()
  const listMs = hrms(tList)

  const tSearch = process.hrtime.bigint()
  const hit = await repo.searchItems('mail', 'all')
  const searchMs = hrms(tSearch)

  const status = await repo.getStatus()
  return {
    total,
    insertMs,
    listMs,
    searchMs,
    listCount: list.length,
    searchCount: hit.length,
    fileBytes: status.fileBytes,
  }
}

async function main() {
  const sizes = [500, 1000, 2000, 5000]
  const report = []
  for (const size of sizes) {
    const row = await runCase(size)
    report.push(row)
    process.stdout.write(`${JSON.stringify(row)}\n`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
