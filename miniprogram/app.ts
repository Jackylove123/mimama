import { PRODUCT_POSITIONING } from './services/runtime-config'
import { ensureVaultReady, onAppHide, onAppShow } from './services/security'
import { prefetchOpenid } from './services/crypto'

App<IAppOption>({
  globalData: {
    productPositioning: PRODUCT_POSITIONING,
  },

  onLaunch() {
    wx.cloud.init({ env: 'cloud1-d3goszbjj907b84c1' })
    ensureVaultReady()
    onAppShow()
    void prefetchOpenid()
  },

  onShow() {
    ensureVaultReady()
    onAppShow()
  },

  onHide() {
    onAppHide()
  },
})
