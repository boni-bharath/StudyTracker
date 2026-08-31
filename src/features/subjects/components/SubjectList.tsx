import type { SubjectWithStudyTime } from '../subject.types'

type SubjectListProps = {
  isSaving: boolean
  onDelete: (subject: SubjectWithStudyTime) => void
  onEdit: (subject: SubjectWithStudyTime) => void
  subjects: SubjectWithStudyTime[]
}

function formatStudyTime(totalStudySeconds: number) {
  const totalMinutes = Math.floor(totalStudySeconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return hours > 0
    ? `${hours}h ${minutes.toString().padStart(2, '0')}m`
    : `${minutes}m`
}

export function SubjectList({
  isSaving,
  onDelete,
  onEdit,
  subjects,
}: SubjectListProps) {
  return (
    <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {subjects.map((subject) => (
        <li
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          key={subject.id}
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="h-4 w-4 shrink-0 rounded-full border border-slate-300"
              style={{ backgroundColor: subject.color }}
            />
            <div>
              <p className="font-medium text-slate-900">{subject.name}</p>
              <p className="text-sm text-slate-500">
                {formatStudyTime(subject.totalStudySeconds)} all-time study
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving}
              onClick={() => onEdit(subject)}
              type="button"
            >
              Edit
            </button>
            <button
              className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving}
              onClick={() => onDelete(subject)}
              type="button"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
