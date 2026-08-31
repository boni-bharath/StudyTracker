import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/auth.context'
import {
  createTodo,
  deleteTodo,
  loadTodos,
  setTodoCompleted,
  TodoServiceError,
  updateTodo,
} from './todo.service'
import type { Todo, TodoInput, TodoSubject } from './todo.types'

type TodosState = {
  error: string | null
  isLoading: boolean
  isSaving: boolean
  subjects: TodoSubject[]
  successMessage: string | null
  todos: Todo[]
}

function errorMessage(error: unknown, action: string) {
  if (error instanceof TodoServiceError) {
    if (error.kind === 'authentication')
      return 'Your session has expired. Please sign in again.'
    if (error.kind === 'configuration')
      return 'Supabase is not configured. Add the public project URL and publishable key to your local .env file.'
    if (error.code === '23503')
      return 'Choose a subject from your current subject list.'
    if (error.code === '23514')
      return 'Choose a valid task priority and enter a task title.'
  }

  return `We could not ${action}. Please try again.`
}

export function useTodos() {
  const { user } = useAuth()
  const [state, setState] = useState<TodosState>({
    error: null,
    isLoading: true,
    isSaving: false,
    subjects: [],
    successMessage: null,
    todos: [],
  })

  const load = useCallback(async () => {
    if (!user) {
      setState((current) => ({
        ...current,
        error: 'Your session has expired. Please sign in again.',
        isLoading: false,
      }))
      return
    }

    setState((current) => ({ ...current, error: null, isLoading: true }))
    try {
      const data = await loadTodos(user.id)
      setState((current) => ({ ...current, ...data, isLoading: false }))
    } catch (error) {
      setState((current) => ({
        ...current,
        error: errorMessage(error, 'load your tasks'),
        isLoading: false,
      }))
    }
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  const save = async (
    action: 'create' | 'edit',
    input: TodoInput,
    id?: string,
  ) => {
    if (!user) return false

    setState((current) => ({
      ...current,
      error: null,
      isSaving: true,
      successMessage: null,
    }))
    try {
      const todo =
        action === 'create'
          ? await createTodo(user.id, input)
          : await updateTodo(user.id, id!, input)
      setState((current) => ({
        ...current,
        isSaving: false,
        successMessage: `“${todo.title}” was ${action === 'create' ? 'added' : 'updated'}.`,
        todos:
          action === 'create'
            ? [todo, ...current.todos]
            : current.todos.map((item) => (item.id === todo.id ? todo : item)),
      }))
      return true
    } catch (error) {
      setState((current) => ({
        ...current,
        error: errorMessage(
          error,
          action === 'create' ? 'add this task' : 'update this task',
        ),
        isSaving: false,
      }))
      return false
    }
  }

  const toggleCompleted = async (todo: Todo) => {
    if (!user) return false
    setState((current) => ({
      ...current,
      error: null,
      isSaving: true,
      successMessage: null,
    }))
    try {
      const updatedTodo = await setTodoCompleted(user.id, todo)
      setState((current) => ({
        ...current,
        isSaving: false,
        successMessage: `“${todo.title}” was marked ${updatedTodo.completed ? 'complete' : 'incomplete'}.`,
        todos: current.todos.map((item) =>
          item.id === todo.id ? updatedTodo : item,
        ),
      }))
      return true
    } catch (error) {
      setState((current) => ({
        ...current,
        error: errorMessage(error, 'update this task'),
        isSaving: false,
      }))
      return false
    }
  }

  const remove = async (todo: Todo) => {
    if (!user) return false
    setState((current) => ({
      ...current,
      error: null,
      isSaving: true,
      successMessage: null,
    }))
    try {
      await deleteTodo(user.id, todo.id)
      setState((current) => ({
        ...current,
        isSaving: false,
        successMessage: `“${todo.title}” was deleted.`,
        todos: current.todos.filter((item) => item.id !== todo.id),
      }))
      return true
    } catch (error) {
      setState((current) => ({
        ...current,
        error: errorMessage(error, 'delete this task'),
        isSaving: false,
      }))
      return false
    }
  }

  return {
    ...state,
    addTodo: (input: TodoInput) => save('create', input),
    editTodo: (id: string, input: TodoInput) => save('edit', input, id),
    load,
    remove,
    toggleCompleted,
  }
}
