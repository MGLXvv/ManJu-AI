import { describe, expect, it } from 'vitest'
import {
  createSettingAssetForm,
  getSettingAssetFieldErrors,
  sanitizeSettingAssetCreateInput,
} from './settingAssetFormState'

describe('settingAssetFormState', () => {
  it('builds type-specific default forms', () => {
    expect(createSettingAssetForm('character')).toEqual({
      type: 'character',
      title: '',
      roleName: '',
      description: '',
      prompt: '',
      voiceId: '',
      voiceName: '',
    })

    expect(createSettingAssetForm('scene')).toEqual({
      type: 'scene',
      title: '',
      description: '',
      prompt: '',
    })

    expect(createSettingAssetForm('prop')).toEqual({
      type: 'prop',
      title: '',
      description: '',
      prompt: '',
    })
  })

  it('requires title and at least one of description or prompt', () => {
    expect(getSettingAssetFieldErrors(createSettingAssetForm('scene'))).toEqual({
      title: true,
      description: true,
      prompt: true,
    })
  })

  it('drops character-only fields when sanitizing scene and prop inputs', () => {
    expect(
      sanitizeSettingAssetCreateInput({
        type: 'scene',
        title: '夜晚街道',
        roleName: 'should-drop',
        description: '霓虹街道',
        prompt: '',
        voiceId: 'voice-1',
        voiceName: '旁白',
      }),
    ).toEqual({
      type: 'scene',
      title: '夜晚街道',
      description: '霓虹街道',
      prompt: '',
    })
  })

  it('keeps the selected default voice on character inputs', () => {
    expect(
      sanitizeSettingAssetCreateInput({
        type: 'character',
        title: '测试角色',
        roleName: '冷面保镖',
        description: '沉稳寡言的角色设定',
        prompt: '测试提示词',
        voiceId: 'voice-1',
        voiceName: '浑厚男中音',
      }),
    ).toEqual({
      type: 'character',
      title: '测试角色',
      roleName: '冷面保镖',
      description: '沉稳寡言的角色设定',
      prompt: '测试提示词',
      voiceId: 'voice-1',
      voiceName: '浑厚男中音',
    })
  })
})
