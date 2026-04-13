export const formatRelativeTime = (timestamp: number) => {
  const delta = Date.now() - timestamp

  if (delta < 60 * 1000) {
    return '刚刚'
  }

  if (delta < 60 * 60 * 1000) {
    return `${Math.floor(delta / (60 * 1000))} 分钟前`
  }

  if (delta < 24 * 60 * 60 * 1000) {
    return `${Math.floor(delta / (60 * 60 * 1000))} 小时前`
  }

  if (delta < 30 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(delta / (24 * 60 * 60 * 1000))} 天前`
  }

  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
