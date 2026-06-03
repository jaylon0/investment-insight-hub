import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export const formatTime = (date) => dayjs(date).format('YYYY-MM-DD HH:mm')
export const timeAgo = (date) => dayjs(date).fromNow()

export const sentimentText = (s) => ({
  bullish: '看多',
  bearish: '看空',
  neutral: '中性'
}[s] || s)

export const sentimentColor = (s) => ({
  bullish: '#4caf50',
  bearish: '#f44336',
  neutral: '#ff9800'
}[s] || '#999')

export const sentimentClass = (s) => ({
  bullish: 'badge-bullish',
  bearish: 'badge-bearish',
  neutral: 'badge-neutral'
}[s] || '')
