const TIMELINE_SINGLE_PAGE_SCENE = 1154

export const isTimelineSinglePageMode = () => {
  try {
    if (typeof wx.getEnterOptionsSync !== 'function') {
      return false
    }

    const options = wx.getEnterOptionsSync()
    return options && options.scene === TIMELINE_SINGLE_PAGE_SCENE
  } catch (error) {
    console.warn('Failed to read current enter scene:', error)
    return false
  }
}
