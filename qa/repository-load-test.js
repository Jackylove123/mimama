const path = require('path')
const os = require('os')
const fs = require('fs')

const dataRoot = path.join(os.tmpdir(), 'mimama-qa-user-data')
fs.rmSync(dataRoot, { recursive: true, force: true })
fs.mkdirSync(dataRoot, { recursive: true })

const storageMap = new Map()

global.wx = {
  env: {
    USER_DATA_PATH: dataRoot,
  },
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

const { getVaultRepository } = require('/tmp/mimama-js/services/vault-repository.js')

const repo = getVaultRepository()

function hrms(start) {
  const diff = process.hrtime.bigint() - start
  return Number(diff / 1000000n)
}

function randomWord(seed) {
  const words = ['wechat', 'github', 'bank', 'mail', 'cloud', 'social', '支付', '财务', '邮箱', '论坛']
  return words[seed % words.length]
}

async function main() {
  const result = {}
  const pin = '123456'

  let t = process.hrtime.bigint()
  await repo.initialize(pin)
  result.initializeMs = hrms(t)

  t = process.hrtime.bigint()
  const verify = await repo.verifyPasscode(pin)
  result.verifyMs = hrms(t)
  result.verifyCode = verify.code

  const total = 20000
  t = process.hrtime.bigint()
  for (let i = 0; i < total; i += 1) {
    await repo.upsertItem({
      title: `站点-${i}-${randomWord(i)}`,
      account: `user_${i}@mail.com`,
      password: `P@ssw0rd_${i}`,
      note: `note_${i}_${randomWord(i + 3)}`,
    })
  }
  result.bulkInsertMs = hrms(t)

  t = process.hrtime.bigint()
  const list = await repo.listItems()
  result.listMs = hrms(t)
  result.listCount = list.length

  t = process.hrtime.bigint()
  const searchHit = await repo.searchItems('mail', 'all')
  result.searchMailMs = hrms(t)
  result.searchMailCount = searchHit.length

  t = process.hrtime.bigint()
  const searchMiss = await repo.searchItems('definitely-no-hit-keyword', 'all')
  result.searchMissMs = hrms(t)
  result.searchMissCount = searchMiss.length

  // soft delete 2000, then list recycle
  t = process.hrtime.bigint()
  for (let i = 0; i < 2000; i += 1) {
    await repo.deleteItem(list[i].id)
  }
  result.bulkDeleteMs = hrms(t)

  t = process.hrtime.bigint()
  const recycle = await repo.listRecycleItems()
  result.listRecycleMs = hrms(t)
  result.recycleCount = recycle.length

  t = process.hrtime.bigint()
  const status = await repo.getStatus()
  result.statusMs = hrms(t)
  result.statusRecordCount = status.recordCount
  result.statusRecycleCount = status.recycleCount
  result.fileBytes = status.fileBytes

  t = process.hrtime.bigint()
  const exportResult = await repo.exportTxt()
  result.exportMs = hrms(t)
  result.exportBytes = Buffer.byteLength(exportResult.txt, 'utf8')

  // import back from export, expect duplicate count high
  t = process.hrtime.bigint()
  const importResult = await repo.importTxt(exportResult.filePath)
  result.reimportMs = hrms(t)
  result.reimportImported = importResult.importedCount
  result.reimportDuplicate = importResult.duplicateCount
  result.reimportSkipped = importResult.skippedCount

  console.log(JSON.stringify(result, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
