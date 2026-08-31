export type StatisticsRange = 'month' | 'today' | 'week' | 'year'

export type StatisticsSubject = {
  color: string
  name: string
}

export type CompletedStudySession = {
  durationSeconds: number
  endTime: string
  id: string
  startTime: string
  subject: StatisticsSubject
  subjectId: string
}

export type DailyStudyTotal = {
  label: string
  localDate: string
  totalSeconds: number
}

export type SubjectStudyTotal = StatisticsSubject & {
  subjectId: string
  totalSeconds: number
}

export type StudyStatistics = {
  allTimeSeconds: number
  averageSessionSeconds: number
  completedSessionCount: number
  dailyTotals: DailyStudyTotal[]
  longestSessionSeconds: number
  monthSeconds: number
  rangeLabel: string
  subjectTotals: SubjectStudyTotal[]
  todaySeconds: number
  weekSeconds: number
  yearSeconds: number
}
