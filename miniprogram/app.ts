import { PRODUCT_POSITIONING } from './services/runtime-config'
import { ensureVaultReady, onAppHide, onAppShow } from './services/security'

App<IAppOption>({
  globalData: {
    productPositioning: PRODUCT_POSITIONING,
  },

  onLaunch() {
    ensureVaultReady()
    onAppShow()
  },

  onShow() {
    ensureVaultReady()
    onAppShow()
  },

  onHide() {
    onAppHide()
  },
})
