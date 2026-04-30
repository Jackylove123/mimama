const path = require('path')
const os = require('os')
const fs = require('fs')

function setupWx(tag) {
  const dataRoot = path.join(os.tmpdir(), `mimama-qa-func-${tag}`)
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

function assert(condition, msg) {
  if (!condition) throw new Error(msg)
}

async function main() {
  setupWx('base')
  const { getVaultRepository } = require('/tmp/mimama-js/services/vault-repository.js')
  const repo = getVaultRepository()

  await repo.initialize('123456')
  let r = await repo.verifyPasscode('123456')
  assert(r.code === 'OK', 'verify correct passcode should be OK')

  // add sample items
  const ids = []
  for (let i = 0; i < 20; i += 1) {
    const id = await repo.upsertItem({
      title: i % 2 === 0 ? `微信-${i}` : `邮箱-${i}`,
      account: `acc_${i}`,
      password: `pw_${i}`,
      note: i % 3 === 0 ? 'note-hit' : '',
    })
    ids.push(id)
  }

  const all = await repo.listItems()
  assert(all.length === 20, 'listItems should return 20')

  const search = await repo.searchItems('note-hit')
  assert(search.length > 0, 'search should find note-hit records')

  await repo.deleteItem(ids[0])
  await repo.deleteItem(ids[1])
  let recycle = await repo.listRecycleItems()
  assert(recycle.length === 2, 'recycle should have 2 items after delete')

  const restored = await repo.restoreRecycleItem(ids[0])
  assert(restored === true, 'restoreRecycleItem should return true')
  recycle = await repo.listRecycleItems()
  assert(recycle.length === 1, 'recycle should have 1 item after restore')

  const removed = await repo.removeRecycleItem(ids[1])
  assert(removed === true, 'removeRecycleItem should return true')
  recycle = await repo.listRecycleItems()
  assert(recycle.length === 0, 'recycle should be empty after remove')

  // export + reimport duplicate detection
  const exported = await repo.exportTxt()
  const imported = await repo.importTxt(exported.filePath)
  assert(imported.importedCount === 0, 'reimport same backup should not import new records')
  assert(imported.duplicateCount > 0, 'reimport should report duplicates')

  // invalid import
  const badPath = path.join(os.tmpdir(), 'mimama-bad-import.txt')
  fs.writeFileSync(badPath, 'bad-data', 'utf8')
  let invalidThrown = false
  try {
    await repo.importTxt(badPath)
  } catch (e) {
    invalidThrown = e && e.message === 'INVALID_IMPORT_TXT'
  }
  assert(invalidThrown, 'invalid import should throw INVALID_IMPORT_TXT')

  // passcode lock behavior
  await repo.lockSession()
  for (let i = 0; i < 4; i += 1) {
    const wrong = await repo.verifyPasscode('000000')
    assert(wrong.code === 'INVALID', 'first 4 wrong attempts should be INVALID')
  }
  const locked = await repo.verifyPasscode('000000')
  assert(locked.code === 'LOCKED', '5th wrong attempt should trigger LOCKED cooldown')

  const status = await repo.getStatus()
  console.log(
    JSON.stringify({
      ok: true,
      statusInitialized: status.initialized,
      statusRecordCount: status.recordCount,
      statusRecycleCount: status.recycleCount,
      statusFileBytes: status.fileBytes,
    }),
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
