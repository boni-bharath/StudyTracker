import { useEffect, useState, type FormEvent } from 'react'

type SubjectFormProps = {
  initialColor?: string
  initialName?: string
  isSubmitting: boolean
  onCancel?: () => void
  onSubmit: (name: string, color: string) => Promise<boolean>
  submitLabel: string
}

export function SubjectForm({
  initialColor = '#6366F1',
  initialName = '',
  isSubmitting,
  onCancel,
  onSubmit,
  submitLabel,
}: SubjectFormProps) {
  const [name, setName] = useState(initialName)
  const [color, setColor] = useState(initialColor)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    setName(initialName)
    setColor(initialColor)
    setValidationError(null)
  }, [initialColor, initialName])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName) {
      setValidationError('Enter a subject name instead of only spaces.')
      return
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      setValidationError('Choose a valid six-digit hex color.')
      return
    }

    const wasSaved = await onSubmit(trimmedName, color)

    if (wasSaved && !initialName) {
      setName('')
      setColor(initialColor)
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div>
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="subject-name"
        >
          Subject name
        </label>
        <input
          autoComplete="off"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
          disabled={isSubmitting}
          id="subject-name"
          maxLength={100}
          onChange={(event) => {
            setName(event.target.value)
            setValidationError(null)
          }}
          placeholder="For example, Java"
          value={name}
        />
        {validationError ? (
          <p className="mt-1 text-sm text-rose-700" role="alert">
            {validationError}
          </p>
        ) : null}
      </div>
      <div>
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="subject-color"
        >
          Subject color
        </label>
        <input
          className="mt-1 block h-10 w-16 cursor-pointer rounded border border-slate-300 bg-white p-1 disabled:cursor-not-allowed disabled:bg-slate-100"
          disabled={isSubmitting}
          id="subject-color"
          onChange={(event) => setColor(event.target.value)}
          type="color"
          value={color}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
        {onCancel ? (
          <button
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed"
            disabled={isSubmitting}
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
