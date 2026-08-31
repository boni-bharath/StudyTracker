import { supabase } from '../../lib/supabase'
import type { Todo, TodoInput, TodoSubject } from './todo.types'

type TodoServiceErrorKind = 'authentication' | 'configuration' | 'database'

export class TodoServiceError extends Error {
  constructor(
    message: string,
    readonly kind: TodoServiceErrorKind,
    readonly code?: string,
  ) {
    super(message)
    this.name = 'TodoServiceError'
  }
}

function getClient() {
  if (!supabase) {
    throw new TodoServiceError('Supabase is not configured.', 'configuration')
  }

  return supabase
}

function databaseError(error: { message: string; code?: string }) {
  if (
    error.code === 'PGRST301' ||
    error.message.toLowerCase().includes('jwt') ||
    error.message.toLowerCase().includes('not authenticated')
  ) {
    return new TodoServiceError(
      'Your session has expired. Please sign in again.',
      'authentication',
      error.code,
    )
  }

  return new TodoServiceError(error.message, 'database', error.code)
}

function todoPayload(input: TodoInput) {
  return {
    description: input.description.trim() || null,
    due_date: input.dueDate || null,
    priority: input.priority,
    subject_id: input.subjectId || null,
    title: input.title.trim(),
  }
}

const todoFields =
  'id, user_id, title, description, subject_id, priority, due_date, completed, created_at, updated_at'

export async function loadTodos(userId: string) {
  const client = getClient()
  const [todosResult, subjectsResult] = await Promise.all([
    client
      .from('todos')
      .select(todoFields)
      .eq('user_id', userId)
      .order('completed', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false }),
    client
      .from('subjects')
      .select('id, name, color')
      .eq('user_id', userId)
      .order('name', { ascending: true }),
  ])

  if (todosResult.error) throw databaseError(todosResult.error)
  if (subjectsResult.error) throw databaseError(subjectsResult.error)

  return {
    subjects: subjectsResult.data as TodoSubject[],
    todos: todosResult.data as Todo[],
  }
}

export async function createTodo(userId: string, input: TodoInput) {
  const { data, error } = await getClient()
    .from('todos')
    .insert({ ...todoPayload(input), user_id: userId })
    .select(todoFields)
    .single()

  if (error) throw databaseError(error)
  return data as Todo
}

export async function updateTodo(userId: string, id: string, input: TodoInput) {
  const { data, error } = await getClient()
    .from('todos')
    .update(todoPayload(input))
    .eq('id', id)
    .eq('user_id', userId)
    .select(todoFields)
    .single()

  if (error) throw databaseError(error)
  return data as Todo
}

export async function setTodoCompleted(userId: string, todo: Todo) {
  const { data, error } = await getClient()
    .from('todos')
    .update({ completed: !todo.completed })
    .eq('id', todo.id)
    .eq('user_id', userId)
    .select(todoFields)
    .single()

  if (error) throw databaseError(error)
  return data as Todo
}

export async function deleteTodo(userId: string, id: string) {
  const { error } = await getClient()
    .from('todos')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw databaseError(error)
}
