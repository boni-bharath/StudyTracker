export type HistorySubject = {
  color: string
  name: string
}

export type HistorySession = {
  durationSeconds: number
  endTime: string
  id: string
  startTime: string
  subject: HistorySubject
  subjectId: string
}
