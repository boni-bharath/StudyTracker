export function formatHistoryDuration(totalSeconds: number) {
  if (totalSeconds < 60) {
    return `${totalSeconds}s`
  }

  const totalMinutes = Math.floor(totalSeconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return hours > 0
    ? `${hours}h ${minutes.toString().padStart(2, '0')}m`
    : `${minutes}m`
}

function localDayKey(date: Date) {
  const parts = new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''

  return `${value('year')}-${value('month')}-${value('day')}`
}

export function historyDateKey(timestamp: string) {
  return localDayKey(new Date(timestamp))
}

export function formatHistoryDate(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp))
}

export function formatHistoryTime(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

export function historyDateHeading(timestamp: string) {
  const sessionDate = historyDateKey(timestamp)
  const today = localDayKey(new Date())
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  if (sessionDate === today) return 'Today'
  if (sessionDate === localDayKey(yesterday)) return 'Yesterday'

  return formatHistoryDate(timestamp)
}
