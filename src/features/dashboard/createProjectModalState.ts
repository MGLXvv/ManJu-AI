export interface CreateProjectFormState {
  name: string
  ratio: '16:9' | '9:16' | ''
  style: string
}

export interface CreateProjectFieldErrors {
  name?: true
  ratio?: true
  style?: true
}

export const createEmptyCreateProjectForm = (): CreateProjectFormState => ({
  name: '',
  ratio: '',
  style: '',
})

export const isCreateProjectFormDirty = (form: CreateProjectFormState): boolean => {
  return form.name.trim().length > 0 || form.ratio !== '' || form.style.trim().length > 0
}

export const getCreateProjectFieldErrors = (form: CreateProjectFormState): CreateProjectFieldErrors => {
  const errors: CreateProjectFieldErrors = {}

  if (!form.name.trim()) {
    errors.name = true
  }

  if (!form.ratio) {
    errors.ratio = true
  }

  if (!form.style.trim()) {
    errors.style = true
  }

  return errors
}
