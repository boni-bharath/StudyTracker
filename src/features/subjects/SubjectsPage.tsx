import { useState } from 'react'
import { isSupabaseConfigured } from '../../lib/supabase'
import { SubjectForm } from './components/SubjectForm'
import { SubjectList } from './components/SubjectList'
import type { SubjectWithStudyTime } from './subject.types'
import { useSubjects } from './useSubjects'

export function SubjectsPage() {
  const {
    addSubject,
    editSubject,
    error,
    isLoading,
    isSaving,
    removeSubject,
    subjects,
    successMessage,
  } = useSubjects()
  const [editingSubject, setEditingSubject] =
    useState<SubjectWithStudyTime | null>(null)
  const [deletingSubject, setDeletingSubject] =
    useState<SubjectWithStudyTime | null>(null)

  return (
    <section className="max-w-4xl">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
          Study Tracker
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Subjects
        </h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Create the subjects you study, then use them in future study sessions
          and tasks.
        </p>
      </div>

      {!isSupabaseConfigured ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Add the public Supabase URL and publishable key to a local{' '}
          <code>.env</code> file before managing subjects. See{' '}
          <code>.env.example</code> for the required variable names.
        </div>
      ) : null}

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

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your subjects</h2>
            <span className="text-sm text-slate-500">
              {subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'}
            </span>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600">
              Loading your subjects…
            </div>
          ) : subjects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <h3 className="font-semibold text-slate-900">No subjects yet</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Add your first subject, such as Java or DBMS, to get started.
              </p>
            </div>
          ) : (
            <SubjectList
              isSaving={isSaving}
              onDelete={setDeletingSubject}
              onEdit={setEditingSubject}
              subjects={subjects}
            />
          )}
        </div>

        <aside className="h-fit min-w-0 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold">
            {editingSubject ? 'Edit subject' : 'Add a subject'}
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {editingSubject
              ? 'Save a new name for this subject.'
              : 'Subject names must be unique.'}
          </p>
          <div className="mt-5">
            <SubjectForm
              initialName={editingSubject?.name}
              initialColor={editingSubject?.color}
              isSubmitting={isSaving}
              onCancel={
                editingSubject ? () => setEditingSubject(null) : undefined
              }
              onSubmit={async (name, color) => {
                if (editingSubject) {
                  const wasUpdated = await editSubject(editingSubject.id, {
                    name,
                    color,
                  })
                  if (wasUpdated) {
                    setEditingSubject(null)
                  }
                  return wasUpdated
                }

                return addSubject({ name, color })
              }}
              submitLabel={editingSubject ? 'Save changes' : 'Add subject'}
            />
          </div>
        </aside>
      </div>

      {deletingSubject ? (
        <div
          aria-labelledby="delete-subject-title"
          aria-modal="true"
          className="fixed inset-0 z-30 grid place-items-center bg-slate-950/40 p-4"
          role="dialog"
        >
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:p-6">
            <h2 className="text-lg font-semibold" id="delete-subject-title">
              Delete {deletingSubject.name}?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This cannot be undone. Subjects with study sessions are protected
              and cannot be deleted.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed"
                disabled={isSaving}
                onClick={() => setDeletingSubject(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                disabled={isSaving}
                onClick={async () => {
                  const wasDeleted = await removeSubject(deletingSubject)
                  if (wasDeleted) {
                    setDeletingSubject(null)
                  }
                }}
                type="button"
              >
                {isSaving ? 'Deleting…' : 'Delete subject'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
