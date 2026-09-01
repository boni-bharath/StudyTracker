import { useState } from 'react'
import { formatStudyTimerDuration, useStudyTimer } from './useStudyTimer'

function completedDurationSeconds(startTime: string, endTime: string | null) {
  if (!endTime) return 0

  return Math.max(
    0,
    Math.floor(
      (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000,
    ),
  )
}

export function StudyPage() {
  const {
    activeElapsedSeconds,
    activeSession,
    completedSession,
    error,
    isLoading,
    isSaving,
    loadTimer,
    start,
    stop,
    subjects,
  } = useStudyTimer()
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const activeSubject = subjects.find(
    (subject) => subject.id === activeSession?.subject_id,
  )

  return (
    <section className="max-w-3xl">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
          Study Tracker
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Study timer
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Focus on one subject at a time. Your session is saved securely and
          will continue after a refresh.
        </p>
      </div>

      {error ? (
        <div
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          role="alert"
        >
          <span>{error}</span>
          {!isSaving ? (
            <button
              className="rounded-lg border border-rose-300 px-3 py-1.5 font-semibold hover:bg-rose-100"
              onClick={() => void loadTimer()}
              type="button"
            >
              Retry
            </button>
          ) : null}
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600">
          Loading your subjects and active study session…
        </div>
      ) : activeSession ? (
        <div className="mt-8 rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Study session in progress
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {activeSubject ? (
              <>
                <span
                  aria-hidden="true"
                  className="h-4 w-4 rounded-full border border-slate-300"
                  style={{ backgroundColor: activeSubject.color }}
                />
                <p className="font-semibold text-slate-900">
                  {activeSubject.name}
                </p>
              </>
            ) : (
              <p className="font-semibold text-slate-900">Current subject</p>
            )}
          </div>
          <p
            aria-label={`Elapsed study time: ${formatStudyTimerDuration(activeElapsedSeconds)}`}
            className="mt-7 font-mono text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl"
          >
            {formatStudyTimerDuration(activeElapsedSeconds)}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Hours : minutes : seconds
          </p>
          <button
            className="mt-8 rounded-lg bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
            disabled={isSaving}
            onClick={() => void stop()}
            type="button"
          >
            {isSaving ? 'Stopping…' : 'Stop study'}
          </button>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold">Start a study session</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Choose the subject you want to focus on. Only one study session can
            be active at a time.
          </p>

          {subjects.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              You need at least one subject before starting a study session.
              Create a subject on the Subjects page first.
            </div>
          ) : (
            <div className="mt-6 max-w-md">
              <label
                className="text-sm font-medium text-slate-700"
                htmlFor="study-subject"
              >
                Subject
              </label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                disabled={isSaving}
                id="study-subject"
                onChange={(event) => setSelectedSubjectId(event.target.value)}
                value={selectedSubjectId}
              >
                <option value="">Select a subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <button
                className="mt-5 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                disabled={!selectedSubjectId || isSaving}
                onClick={() => void start(selectedSubjectId)}
                type="button"
              >
                {isSaving ? 'Starting…' : 'Start study'}
              </button>
            </div>
          )}
        </div>
      )}

      {completedSession ? (
        <div
          className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5"
          role="status"
        >
          <p className="font-semibold text-emerald-900">
            Study session completed
          </p>
          <p className="mt-1 text-sm text-emerald-800">
            Duration:{' '}
            {formatStudyTimerDuration(
              completedDurationSeconds(
                completedSession.start_time,
                completedSession.end_time,
              ),
            )}
          </p>
        </div>
      ) : null}
    </section>
  )
}
