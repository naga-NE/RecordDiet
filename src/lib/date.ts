export function localDateKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatDate(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  return new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' }).format(new Date(y, m - 1, d))
}

export function formatTime(iso?: string) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso))
}

export function dateDaysAgo(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return localDateKey(d)
}
