export type Subject = {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
  updated_at: string
}

export type SubjectInput = {
  name: string
  color: string
}

export type SubjectWithStudyTime = Subject & {
  totalStudySeconds: number
}
