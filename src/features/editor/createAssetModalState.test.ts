import { describe, expect, it } from 'vitest'
import {
  createEmptyCreateAssetForm,
  getCreateAssetFieldErrors,
  isCreateAssetFormDirty,
} from './createAssetModalState'

describe('createAssetModalState', () => {
  it('flags every required field when create is triggered with an empty form', () => {
    const errors = getCreateAssetFieldErrors(createEmptyCreateAssetForm())

    expect(errors).toEqual({
      title: true,
      prompt: true,
    })
  })

  it('treats partially completed form as dirty', () => {
    const form = createEmptyCreateAssetForm()
    form.title = '测试角色'

    expect(isCreateAssetFormDirty(form)).toBe(true)
  })

  it('returns no field errors when every required field is completed', () => {
    const form = createEmptyCreateAssetForm()
    form.type = 'scene'
    form.title = '夜晚街道'
    form.prompt = '赛博街道，霓虹灯，潮湿地面'

    expect(getCreateAssetFieldErrors(form)).toEqual({})
  })
})
