export type TodoPriority = 'high' | 'low' | 'medium'

export type TodoSubject = {
  color: string
  id: string
  name: string
}

export type Todo = {
  completed: boolean
  created_at: string
  description: string | null
  due_date: string | null
  id: string
  priority: TodoPriority
  subject_id: string | null
  title: string
  updated_at: string
  user_id: string
}

export type TodoInput = {
  description: string
  dueDate: string
  priority: TodoPriority
  subjectId: string
  title: string
}
