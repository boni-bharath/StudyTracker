import { useCallback, useEffect, useState } from 'react'
import {
  createSubject,
  deleteSubject,
  listSubjects,
  SubjectServiceError,
  updateSubject,
} from './subject.service'
import type { SubjectInput, SubjectWithStudyTime } from './subject.types'

type SubjectsState = {
  subjects: SubjectWithStudyTime[]
  isLoading: boolean
  isSaving: boolean
  error: string | null
  successMessage: string | null
}

function messageForError(error: unknown, action: string): string {
  if (error instanceof SubjectServiceError) {
    if (error.code === '23505') {
      return 'You already have a subject with this name.'
    }

    if (error.code === '23503') {
      return 'This subject has study sessions and cannot be deleted.'
    }

    return error.message
  }

  return 'We could not ' + action + '. Please try again.'
}

export function useSubjects() {
  const [state, setState] = useState<SubjectsState>({
    subjects: [],
    isLoading: true,
    isSaving: false,
    error: null,
    successMessage: null,
  })

  const loadSubjects = useCallback(async () => {
    setState((current) => ({
      ...current,
      isLoading: true,
      error: null,
    }))

    try {
      const subjects = await listSubjects()
      setState((current) => ({
        ...current,
        subjects,
        isLoading: false,
      }))
    } catch (error) {
      setState((current) => ({
        ...current,
        isLoading: false,
        error: messageForError(error, 'load your subjects'),
      }))
    }
  }, [])

  useEffect(() => {
    void loadSubjects()
  }, [loadSubjects])

  const addSubject = async (input: SubjectInput) => {
    setState((current) => ({
      ...current,
      isSaving: true,
      error: null,
      successMessage: null,
    }))

    try {
      const subject = await createSubject(input)
      setState((current) => ({
        ...current,
        subjects: [
          ...current.subjects,
          { ...subject, totalStudySeconds: 0 },
        ].sort((a, b) => a.name.localeCompare(b.name)),
        isSaving: false,
        successMessage: '"' + subject.name + '" was created.',
      }))
      return true
    } catch (error) {
      setState((current) => ({
        ...current,
        isSaving: false,
        error: messageForError(error, 'create this subject'),
      }))
      return false
    }
  }

  const editSubject = async (id: string, input: SubjectInput) => {
    setState((current) => ({
      ...current,
      isSaving: true,
      error: null,
      successMessage: null,
    }))

    try {
      const updatedSubject = await updateSubject(id, input)
      setState((current) => ({
        ...current,
        subjects: current.subjects
          .map((subject) =>
            subject.id === id
              ? {
                  ...updatedSubject,
                  totalStudySeconds: subject.totalStudySeconds,
                }
              : subject,
          )
          .sort((a, b) => a.name.localeCompare(b.name)),
        isSaving: false,
        successMessage: '"' + updatedSubject.name + '" was updated.',
      }))
      return true
    } catch (error) {
      setState((current) => ({
        ...current,
        isSaving: false,
        error: messageForError(error, 'update this subject'),
      }))
      return false
    }
  }

  const removeSubject = async (subject: SubjectWithStudyTime) => {
    setState((current) => ({
      ...current,
      isSaving: true,
      error: null,
      successMessage: null,
    }))

    try {
      await deleteSubject(subject.id)
      setState((current) => ({
        ...current,
        subjects: current.subjects.filter((item) => item.id !== subject.id),
        isSaving: false,
        successMessage: '"' + subject.name + '" was deleted.',
      }))
      return true
    } catch (error) {
      setState((current) => ({
        ...current,
        isSaving: false,
        error: messageForError(error, 'delete this subject'),
      }))
      return false
    }
  }

  return {
    ...state,
    addSubject,
    editSubject,
    loadSubjects,
    removeSubject,
  }
}
