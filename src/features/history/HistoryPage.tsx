import { useMemo, useState } from 'react'
import {
  formatHistoryDuration,
  formatHistoryTime,
  historyDateHeading,
  historyDateKey,
} from './history.utils'
import { useStudyHistory } from './useStudyHistory'

export function HistoryPage() {
  const { error, isLoading, loadHistory, sessions } = useStudyHistory()
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')

  const subjects = useMemo(
    () =>
      [
        ...new Map(
          sessions.map((session) => [session.subjectId, session.subject]),
        ).entries(),
      ]
        .map(([id, subject]) => ({ id, ...subject }))
        .sort((first, second) => first.name.localeCompare(second.name)),
    [sessions],
  )

  const filteredSessions = useMemo(
    () =>
      sessions.filter(
        (session) =>
          (!selectedSubjectId || session.subjectId === selectedSubjectId) &&
          (!selectedDate || historyDateKey(session.startTime) === selectedDate),
      ),
    [selectedDate, selectedSubjectId, sessions],
  )

  const sessionGroups = useMemo(() => {
    const groups = new Map<string, typeof filteredSessions>()

    for (const session of filteredSessions) {
      const key = historyDateKey(session.startTime)
      groups.set(key, [...(groups.get(key) ?? []), session])
    }

    return [...groups.values()]
  }, [filteredSessions])

  return (
    <section className="max-w-4xl">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
          Study Tracker
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Study history
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Review completed sessions in your browser&apos;s local timezone.
        </p>
      </div>

      {error ? (
        <div
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          role="alert"
        >
          <span>{error}</span>
          <button
            className="rounded-lg border border-rose-300 px-3 py-1.5 font-semibold hover:bg-rose-100"
            onClick={() => void loadHistory()}
            type="button"
          >
            Retry
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600">
          Loading your completed study sessions…
        </div>
      ) : (
        <>
          <div className="mt-8 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 sm:p-5">
            <div className="min-w-0">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="history-subject"
              >
                Subject
              </label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                id="history-subject"
                onChange={(event) => setSelectedSubjectId(event.target.value)}
                value={selectedSubjectId}
              >
                <option value="">All subjects</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="history-date"
              >
                Local date
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                id="history-date"
                onChange={(event) => setSelectedDate(event.target.value)}
                type="date"
                value={selectedDate}
              />
            </div>
          </div>

          {sessions.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <h2 className="font-semibold text-slate-900">
                No completed sessions yet
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Complete a study session to see it in your history.
              </p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <h2 className="font-semibold text-slate-900">
                No matching sessions
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Try a different subject or clear the date filter.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-8">
              {sessionGroups.map((group) => (
                <section key={historyDateKey(group[0].startTime)}>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {historyDateHeading(group[0].startTime)}
                  </h2>
                  <ul className="mt-3 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {group.map((session) => (
                      <li className="p-4 sm:p-5" key={session.id}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              aria-hidden="true"
                              className="h-4 w-4 shrink-0 rounded-full border border-slate-300"
                              style={{ backgroundColor: session.subject.color }}
                            />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900">
                                {session.subject.name}
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                {formatHistoryTime(session.startTime)} →{' '}
                                {formatHistoryTime(session.endTime)}
                              </p>
                            </div>
                          </div>
                          <p className="font-semibold text-slate-900">
                            {formatHistoryDuration(session.durationSeconds)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
