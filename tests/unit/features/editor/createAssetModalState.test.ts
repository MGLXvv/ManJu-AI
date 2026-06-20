import { describe, expect, it } from 'vitest'
import {
  createEmptyCreateAssetForm,
  getCreateAssetFieldErrors,
  isCreateAssetFormDirty,
} from '@/features/editor/createAssetModalState'

describe('createAssetModalState', () => {
  it('flags title and both content fields when create is triggered with an empty form', () => {
    const errors = getCreateAssetFieldErrors(createEmptyCreateAssetForm())

    expect(errors).toEqual({
      title: true,
      description: true,
      prompt: true,
    })
  })

  it('treats partially completed form as dirty', () => {
    const form = createEmptyCreateAssetForm()
    form.title = '测试角色'

    expect(isCreateAssetFormDirty(form)).toBe(true)
  })

  it('returns no field errors when title and description are completed', () => {
    const form = createEmptyCreateAssetForm()
    form.type = 'scene'
    form.title = '夜晚街道'
    form.description = '霓虹街道与潮湿地面'

    expect(getCreateAssetFieldErrors(form)).toEqual({})
  })
})
