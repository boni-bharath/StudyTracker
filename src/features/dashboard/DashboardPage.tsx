import { Link } from 'react-router-dom'
import { useUserSettings } from '../settings/useUserSettings'
import { formatStudyDuration } from '../statistics/statistics.utils'
import { useStudyStatistics } from '../statistics/useStudyStatistics'
import { formatStudyTimerDuration, useStudyTimer } from '../study/useStudyTimer'
import { useTodos } from '../todos/useTodos'

const priorityRank = { high: 0, medium: 1, low: 2 }

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatSessionTime(time: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(time))
}

export function DashboardPage() {
  const timer = useStudyTimer()
  const study = useStudyStatistics('today')
  const todoData = useTodos()
  const { reloadSettings, settings } = useUserSettings()
  const goalSeconds = settings.dailyGoalMinutes * 60
  const goalProgress = Math.min(
    100,
    goalSeconds > 0 ? (study.statistics.todaySeconds / goalSeconds) * 100 : 0,
  )
  const activeSubject = timer.subjects.find(
    (subject) => subject.id === timer.activeSession?.subject_id,
  )
  const pendingTodos = todoData.todos.filter((todo) => !todo.completed)
  const todayTasks = [...pendingTodos]
    .sort(
      (first, second) =>
        priorityRank[first.priority] - priorityRank[second.priority] ||
        (first.due_date ?? '9999-12-31').localeCompare(
          second.due_date ?? '9999-12-31',
        ),
    )
    .slice(0, 3)

  function refreshDashboard() {
    void Promise.all([
      timer.loadTimer(),
      study.loadStatistics(),
      todoData.load(),
      reloadSettings(),
    ])
  }

  return (
    <section className="max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Study Tracker
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Your study progress and next priorities for today.
          </p>
        </div>
        <button
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          onClick={refreshDashboard}
          type="button"
        >
          Refresh
        </button>
      </div>

      {study.error || timer.error || todoData.error ? (
        <div
          className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          role="alert"
        >
          Some dashboard information could not be loaded. Use Refresh to try
          again.
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)]">
        <section className="min-w-0 rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
                Today&apos;s focus
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                {study.isLoading
                  ? 'Calculating...'
                  : formatStudyDuration(study.statistics.todaySeconds)}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Completed study time
              </p>
            </div>
            <Link
              className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              to="/study"
            >
              {timer.activeSession ? 'Continue study' : 'Start study'}
            </Link>
          </div>
          <div className="mt-7">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-semibold text-slate-900">Daily goal</h3>
              <span className="text-sm font-semibold text-slate-700">
                {goalProgress.toFixed(0)}%
              </span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                aria-label="Daily goal progress"
                className="h-full rounded-full bg-indigo-600 transition-[width]"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-slate-600">
              {formatStudyDuration(
                Math.min(study.statistics.todaySeconds, goalSeconds),
              )}{' '}
              of {formatStudyDuration(goalSeconds)} completed.
            </p>
          </div>
        </section>

        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium text-slate-600">Current streak</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {study.isLoading
              ? '-'
              : `${study.streak.currentStreak} ${study.streak.currentStreak === 1 ? 'day' : 'days'}`}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Longest:{' '}
            {study.isLoading
              ? '-'
              : `${study.streak.longestStreak} ${study.streak.longestStreak === 1 ? 'day' : 'days'}`}
          </p>
          <Link
            className="mt-5 inline-block text-sm font-semibold text-indigo-700 hover:text-indigo-600"
            to="/statistics"
          >
            View statistics
          </Link>
        </section>
      </div>

      {timer.isLoading ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          Loading your active study session...
        </div>
      ) : timer.activeSession ? (
        <section className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50 p-5 sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">
            Study session in progress
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {activeSubject ? (
                <span
                  aria-hidden="true"
                  className="h-3.5 w-3.5 rounded-full border border-slate-300"
                  style={{ backgroundColor: activeSubject.color }}
                />
              ) : null}
              <div>
                <p className="font-semibold text-slate-900">
                  {activeSubject?.name ?? 'Current subject'}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Elapsed:{' '}
                  {formatStudyTimerDuration(timer.activeElapsedSeconds)}
                </p>
              </div>
            </div>
            <Link
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              to="/study"
            >
              Continue study
            </Link>
          </div>
        </section>
      ) : timer.subjects.length === 0 ? (
        <section className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
          Create a subject before starting your first study session.{' '}
          <Link
            className="font-semibold text-indigo-700 hover:text-indigo-600"
            to="/subjects"
          >
            Go to subjects
          </Link>
        </section>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Today by subject
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Completed study time today.
              </p>
            </div>
            <Link
              className="text-sm font-semibold text-indigo-700 hover:text-indigo-600"
              to="/statistics"
            >
              Details
            </Link>
          </div>
          {study.isLoading ? (
            <p className="mt-5 text-sm text-slate-600">
              Calculating your subject breakdown...
            </p>
          ) : study.statistics.subjectTotals.length === 0 ? (
            <p className="mt-5 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">
              No completed study sessions today.
            </p>
          ) : (
            <ul className="mt-5 space-y-3">
              {study.statistics.subjectTotals.map((subject) => (
                <li
                  className="flex items-center justify-between gap-4"
                  key={subject.subjectId}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-300"
                      style={{ backgroundColor: subject.color }}
                    />
                    <span className="truncate font-medium text-slate-900">
                      {subject.name}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-slate-700">
                    {formatStudyDuration(subject.totalSeconds)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Today&apos;s tasks
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {todoData.isLoading
                  ? 'Loading tasks...'
                  : `${pendingTodos.length} pending`}
              </p>
            </div>
            <Link
              className="text-sm font-semibold text-indigo-700 hover:text-indigo-600"
              to="/todos"
            >
              View all
            </Link>
          </div>
          {!todoData.isLoading &&
            (todayTasks.length === 0 ? (
              <p className="mt-5 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                No pending tasks. You&apos;re all caught up.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-200">
                {todayTasks.map((todo) => (
                  <li className="py-3 first:pt-0" key={todo.id}>
                    <p className="font-medium text-slate-900">{todo.title}</p>
                    <p className="mt-1 text-xs capitalize text-slate-600">
                      {todo.priority} priority
                      {todo.due_date === localDateKey()
                        ? ' - Due today'
                        : todo.due_date
                          ? ` - Due ${todo.due_date}`
                          : ''}
                    </p>
                  </li>
                ))}
              </ul>
            ))}
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Recent sessions
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Your latest completed study sessions.
            </p>
          </div>
          <Link
            className="text-sm font-semibold text-indigo-700 hover:text-indigo-600"
            to="/history"
          >
            View history
          </Link>
        </div>
        {study.isLoading ? (
          <p className="mt-5 text-sm text-slate-600">
            Loading completed sessions...
          </p>
        ) : study.sessions.length === 0 ? (
          <p className="mt-5 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">
            No completed sessions yet. Start studying to build your history.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200">
            {study.sessions.slice(0, 4).map((session) => (
              <li
                className="flex flex-wrap items-center justify-between gap-3 p-4"
                key={session.id}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-300"
                    style={{ backgroundColor: session.subject.color }}
                  />
                  <div>
                    <p className="font-medium text-slate-900">
                      {session.subject.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Ended {formatSessionTime(session.endTime)}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  {formatStudyDuration(session.durationSeconds)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
        <Link
          className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100"
          to="/statistics"
        >
          Statistics
        </Link>
        <Link
          className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100"
          to="/history"
        >
          History
        </Link>
        <Link
          className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100"
          to="/subjects"
        >
          Subjects
        </Link>
        <Link
          className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100"
          to="/todos"
        >
          Tasks
        </Link>
      </div>
    </section>
  )
}
