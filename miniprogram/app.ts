import { PRODUCT_POSITIONING } from './services/runtime-config'
import { onAppHide, onAppShow } from './services/security'

App<IAppOption>({
  globalData: {
    productPositioning: PRODUCT_POSITIONING,
  },

  onLaunch() {
    onAppShow()
  },

  onShow() {
    onAppShow()
  },

  onHide() {
    onAppHide()
  },
})
