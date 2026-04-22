import { needsUnlock } from '../services/security'

export const ensureUnlocked = (redirectPath: string) => {
  if (!needsUnlock()) {
    return true
  }

  wx.reLaunch({
    url: `/pages/pin/index?redirect=${encodeURIComponent(redirectPath)}`,
  })

  return false
}
