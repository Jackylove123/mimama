/// <reference path="./types/index.d.ts" />

type StorageMode = 'local' | 'cloud'

interface IAppOption extends WechatMiniprogram.IAnyObject {
  globalData: {
    storageMode: StorageMode
  }
}
