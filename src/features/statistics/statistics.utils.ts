import type {
  CompletedStudySession,
  DailyStudyTotal,
  StatisticsRange,
  StudyStatistics,
  SubjectStudyTotal,
} from './statistics.types'

export function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfLocalWeek(date: Date) {
  const start = startOfLocalDay(date)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  return start
}

function startOfLocalMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfLocalYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1)
}

export function localDateKey(date: Date) {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dailyLabel(date: Date, range: StatisticsRange) {
  return new Intl.DateTimeFormat(undefined, {
    day: range === 'today' ? undefined : 'numeric',
    month: range === 'year' ? 'short' : undefined,
    weekday: range === 'week' ? 'short' : undefined,
  }).format(date)
}

function rangeStart(range: StatisticsRange, now: Date) {
  if (range === 'today') return startOfLocalDay(now)
  if (range === 'week') return startOfLocalWeek(now)
  if (range === 'month') return startOfLocalMonth(now)
  return startOfLocalYear(now)
}

function rangeLabel(range: StatisticsRange) {
  if (range === 'today') return 'Today'
  if (range === 'week') return 'This week'
  if (range === 'month') return 'This month'
  return 'This year'
}

export function splitStudySessionByLocalDay(
  session: CompletedStudySession,
  rangeStartTime: Date,
  rangeEndTime: Date,
) {
  const start = Math.max(
    new Date(session.startTime).getTime(),
    rangeStartTime.getTime(),
  )
  const end = Math.min(
    new Date(session.endTime).getTime(),
    rangeEndTime.getTime(),
  )

  if (end <= start) return []

  const portions: Array<{ date: Date; seconds: number }> = []
  let cursor = start

  while (cursor < end) {
    const cursorDate = new Date(cursor)
    const nextLocalMidnight = new Date(
      cursorDate.getFullYear(),
      cursorDate.getMonth(),
      cursorDate.getDate() + 1,
    ).getTime()
    const portionEnd = Math.min(nextLocalMidnight, end)
    portions.push({
      date: cursorDate,
      seconds: (portionEnd - cursor) / 1000,
    })
    cursor = portionEnd
  }

  return portions
}

function totalWithinRange(
  sessions: CompletedStudySession[],
  start: Date,
  end: Date,
) {
  return sessions.reduce(
    (total, session) =>
      total +
      splitStudySessionByLocalDay(session, start, end).reduce(
        (sessionTotal, portion) => sessionTotal + portion.seconds,
        0,
      ),
    0,
  )
}

function dateSeries(
  start: Date,
  end: Date,
  range: StatisticsRange,
): DailyStudyTotal[] {
  const days: DailyStudyTotal[] = []
  const cursor = startOfLocalDay(start)
  const lastDay = startOfLocalDay(end)

  while (cursor <= lastDay) {
    days.push({
      label: dailyLabel(cursor, range),
      localDate: localDateKey(cursor),
      totalSeconds: 0,
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

export function formatStudyDuration(totalSeconds: number) {
  const roundedSeconds = Math.max(0, Math.floor(totalSeconds))

  if (roundedSeconds < 60) return `${roundedSeconds}s`

  const totalMinutes = Math.floor(roundedSeconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return hours > 0
    ? `${hours}h ${minutes.toString().padStart(2, '0')}m`
    : `${minutes}m`
}

export function formatChartMinutes(totalSeconds: number) {
  return `${Math.round(totalSeconds / 60)}m`
}

export function deriveStudyStatistics(
  sessions: CompletedStudySession[],
  selectedRange: StatisticsRange,
  currentTime = new Date(),
): StudyStatistics {
  const now = new Date(currentTime)
  const completedSessions = sessions.filter(
    (session) => new Date(session.endTime) <= now,
  )
  const selectedRangeStart = rangeStart(selectedRange, now)
  const rangeEnd = now
  const dailyTotals = dateSeries(selectedRangeStart, rangeEnd, selectedRange)
  const dailyTotalsByDate = new Map(
    dailyTotals.map((total) => [total.localDate, total]),
  )
  const subjectTotalsById = new Map<string, SubjectStudyTotal>()

  for (const session of completedSessions) {
    for (const portion of splitStudySessionByLocalDay(
      session,
      selectedRangeStart,
      rangeEnd,
    )) {
      const dateTotal = dailyTotalsByDate.get(localDateKey(portion.date))
      if (dateTotal) dateTotal.totalSeconds += portion.seconds

      const existingSubject = subjectTotalsById.get(session.subjectId)
      if (existingSubject) {
        existingSubject.totalSeconds += portion.seconds
      } else {
        subjectTotalsById.set(session.subjectId, {
          ...session.subject,
          subjectId: session.subjectId,
          totalSeconds: portion.seconds,
        })
      }
    }
  }

  const totalDuration = completedSessions.reduce(
    (total, session) => total + session.durationSeconds,
    0,
  )
  const longestDuration = completedSessions.reduce(
    (longest, session) => Math.max(longest, session.durationSeconds),
    0,
  )

  return {
    allTimeSeconds: totalWithinRange(completedSessions, new Date(0), now),
    averageSessionSeconds:
      completedSessions.length > 0
        ? totalDuration / completedSessions.length
        : 0,
    completedSessionCount: completedSessions.length,
    dailyTotals,
    longestSessionSeconds: longestDuration,
    monthSeconds: totalWithinRange(
      completedSessions,
      startOfLocalMonth(now),
      now,
    ),
    rangeLabel: rangeLabel(selectedRange),
    subjectTotals: [...subjectTotalsById.values()].sort(
      (first, second) => second.totalSeconds - first.totalSeconds,
    ),
    todaySeconds: totalWithinRange(
      completedSessions,
      startOfLocalDay(now),
      now,
    ),
    weekSeconds: totalWithinRange(
      completedSessions,
      startOfLocalWeek(now),
      now,
    ),
    yearSeconds: totalWithinRange(
      completedSessions,
      startOfLocalYear(now),
      now,
    ),
  }
}
