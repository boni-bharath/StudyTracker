export type StudySubject = {
  color: string
  id: string
  name: string
}

export type StudySession = {
  end_time: string | null
  id: string
  start_time: string
  subject_id: string
  user_id: string
}

export type StudyTimerData = {
  activeSession: StudySession | null
  subjects: StudySubject[]
}
