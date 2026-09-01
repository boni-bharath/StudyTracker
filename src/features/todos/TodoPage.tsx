import { useEffect, useState, type FormEvent } from 'react'
import type { Todo, TodoInput, TodoPriority, TodoSubject } from './todo.types'
import { useTodos } from './useTodos'

const priorities: TodoPriority[] = ['high', 'medium', 'low']
const emptyInput: TodoInput = {
  description: '',
  dueDate: '',
  priority: 'medium',
  subjectId: '',
  title: '',
}

function TodoForm({
  initialTodo,
  isSaving,
  onCancel,
  onSubmit,
  subjects,
}: {
  initialTodo: Todo | null
  isSaving: boolean
  onCancel: () => void
  onSubmit: (input: TodoInput) => Promise<boolean>
  subjects: TodoSubject[]
}) {
  const [input, setInput] = useState<TodoInput>(emptyInput)
  const [validationError, setValidationError] = useState<string | null>(null)
  useEffect(() => {
    setInput(
      initialTodo
        ? {
            description: initialTodo.description ?? '',
            dueDate: initialTodo.due_date ?? '',
            priority: initialTodo.priority,
            subjectId: initialTodo.subject_id ?? '',
            title: initialTodo.title,
          }
        : emptyInput,
    )
    setValidationError(null)
  }, [initialTodo])
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!input.title.trim()) {
      setValidationError('Enter a task title instead of only spaces.')
      return
    }
    if ((await onSubmit(input)) && !initialTodo) setInput(emptyInput)
  }
  return (
    <form className="space-y-4" onSubmit={submit}>
      <div>
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="todo-title"
        >
          Task title
        </label>
        <input
          autoComplete="off"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
          disabled={isSaving}
          id="todo-title"
          maxLength={200}
          onChange={(event) => {
            setInput((current) => ({ ...current, title: event.target.value }))
            setValidationError(null)
          }}
          value={input.title}
        />
        {validationError ? (
          <p className="mt-1 text-sm text-rose-700">{validationError}</p>
        ) : null}
      </div>
      <div>
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="todo-description"
        >
          Notes <span className="text-slate-500">(optional)</span>
        </label>
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
          disabled={isSaving}
          id="todo-description"
          onChange={(event) =>
            setInput((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          rows={3}
          value={input.description}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="todo-subject"
        >
          Subject
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
            disabled={isSaving}
            id="todo-subject"
            onChange={(event) =>
              setInput((current) => ({
                ...current,
                subjectId: event.target.value,
              }))
            }
            value={input.subjectId}
          >
            <option value="">No subject</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </label>
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="todo-priority"
        >
          Priority
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 capitalize text-slate-950 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
            disabled={isSaving}
            id="todo-priority"
            onChange={(event) =>
              setInput((current) => ({
                ...current,
                priority: event.target.value as TodoPriority,
              }))
            }
            value={input.priority}
          >
            {priorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </label>
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="todo-due-date"
        >
          Due date
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
            disabled={isSaving}
            id="todo-due-date"
            onChange={(event) =>
              setInput((current) => ({
                ...current,
                dueDate: event.target.value,
              }))
            }
            type="date"
            value={input.dueDate}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? 'Saving…' : initialTodo ? 'Save changes' : 'Add task'}
        </button>
        {initialTodo ? (
          <button
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            disabled={isSaving}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  )
}

function TodoList({
  todos,
  isSaving,
  onDelete,
  onEdit,
  onToggle,
  subjects,
}: {
  todos: Todo[]
  isSaving: boolean
  onDelete: (todo: Todo) => void
  onEdit: (todo: Todo) => void
  onToggle: (todo: Todo) => void
  subjects: TodoSubject[]
}) {
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]))
  return (
    <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {todos.map((todo) => {
        const subject = todo.subject_id
          ? subjectById.get(todo.subject_id)
          : null
        return (
          <li className="flex gap-3 p-4 sm:p-5" key={todo.id}>
            <input
              aria-label={`Mark ${todo.title} ${todo.completed ? 'incomplete' : 'complete'}`}
              checked={todo.completed}
              className="mt-1 h-4 w-4 accent-indigo-600"
              disabled={isSaving}
              onChange={() => onToggle(todo)}
              type="checkbox"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className={
                      todo.completed
                        ? 'break-words font-semibold text-slate-500 line-through'
                        : 'break-words font-semibold text-slate-900'
                    }
                  >
                    {todo.title}
                  </p>
                  {todo.description ? (
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">
                      {todo.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    disabled={isSaving}
                    onClick={() => onEdit(todo)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                    disabled={isSaving}
                    onClick={() => onDelete(todo)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium">
                {subject ? (
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: subject.color }}
                    />
                    {subject.name}
                  </span>
                ) : null}
                <span className="capitalize text-indigo-700">
                  {todo.priority} priority
                </span>
                {todo.due_date ? (
                  <span className="text-slate-500">Due {todo.due_date}</span>
                ) : null}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function TodoPage() {
  const {
    addTodo,
    editTodo,
    error,
    isLoading,
    isSaving,
    remove,
    subjects,
    successMessage,
    todos,
    toggleCompleted,
  } = useTodos()
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [deletingTodo, setDeletingTodo] = useState<Todo | null>(null)
  const pendingTodos = todos.filter((todo) => !todo.completed)
  const completedTodos = todos.filter((todo) => todo.completed)
  return (
    <section className="max-w-4xl">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
          Study Tracker
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Tasks
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Plan study tasks and keep their progress in one place.
        </p>
      </div>
      {error ? (
        <div
          className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      {successMessage ? (
        <div
          className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          role="status"
        >
          {successMessage}
        </div>
      ) : null}
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-8">
          {isLoading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600">
              Loading your tasks…
            </div>
          ) : todos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <h2 className="font-semibold text-slate-900">No tasks yet</h2>
              <p className="mt-2 text-sm text-slate-600">
                Add a study task to plan your next session.
              </p>
            </div>
          ) : (
            <>
              <div>
                <h2 className="mb-3 text-lg font-semibold">
                  Pending tasks ({pendingTodos.length})
                </h2>
                {pendingTodos.length ? (
                  <TodoList
                    todos={pendingTodos}
                    subjects={subjects}
                    isSaving={isSaving}
                    onEdit={setEditingTodo}
                    onDelete={setDeletingTodo}
                    onToggle={(todo) => void toggleCompleted(todo)}
                  />
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
                    All tasks are complete.
                  </p>
                )}
              </div>
              <div>
                <h2 className="mb-3 text-lg font-semibold">
                  Completed tasks ({completedTodos.length})
                </h2>
                {completedTodos.length ? (
                  <TodoList
                    todos={completedTodos}
                    subjects={subjects}
                    isSaving={isSaving}
                    onEdit={setEditingTodo}
                    onDelete={setDeletingTodo}
                    onToggle={(todo) => void toggleCompleted(todo)}
                  />
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
                    Completed tasks will appear here.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
        <aside className="h-fit min-w-0 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold">
            {editingTodo ? 'Edit task' : 'Add a task'}
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {editingTodo
              ? 'Update your task details.'
              : 'Tasks can be linked to a subject or left unassigned.'}
          </p>
          <div className="mt-5">
            <TodoForm
              initialTodo={editingTodo}
              isSaving={isSaving}
              subjects={subjects}
              onCancel={() => setEditingTodo(null)}
              onSubmit={async (input) => {
                const saved = editingTodo
                  ? await editTodo(editingTodo.id, input)
                  : await addTodo(input)
                if (saved && editingTodo) setEditingTodo(null)
                return saved
              }}
            />
          </div>
        </aside>
      </div>
      {deletingTodo ? (
        <div
          aria-labelledby="delete-todo-title"
          aria-modal="true"
          className="fixed inset-0 z-30 grid place-items-center bg-slate-950/40 p-4"
          role="dialog"
        >
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:p-6">
            <h2 className="text-lg font-semibold" id="delete-todo-title">
              Delete {deletingTodo.title}?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              This cannot be undone.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                disabled={isSaving}
                onClick={() => setDeletingTodo(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:bg-rose-300"
                disabled={isSaving}
                onClick={async () => {
                  if (await remove(deletingTodo)) setDeletingTodo(null)
                }}
                type="button"
              >
                {isSaving ? 'Deleting…' : 'Delete task'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
