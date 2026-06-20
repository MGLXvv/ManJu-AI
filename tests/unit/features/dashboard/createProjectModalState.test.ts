import { describe, expect, it } from 'vitest'
import {
  createEmptyCreateProjectForm,
  getCreateProjectFieldErrors,
  isCreateProjectFormDirty,
} from '@/features/dashboard/createProjectModalState'

describe('createProjectModalState', () => {
  it('flags every required field when create is triggered with an empty form', () => {
    const errors = getCreateProjectFieldErrors(createEmptyCreateProjectForm())

    expect(errors).toEqual({
      name: true,
      ratio: true,
      style: true,
    })
  })

  it('treats partially completed form as dirty', () => {
    const form = createEmptyCreateProjectForm()
    form.name = '测试项目'

    expect(isCreateProjectFormDirty(form)).toBe(true)
  })

  it('returns no field errors when every required field is completed', () => {
    const form = createEmptyCreateProjectForm()
    form.name = '测试项目'
    form.ratio = '16:9'
    form.style = '国漫'

    expect(getCreateProjectFieldErrors(form)).toEqual({})
  })
})
