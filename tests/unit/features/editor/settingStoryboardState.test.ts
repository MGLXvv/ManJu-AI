import { describe, expect, it } from 'vitest'
import type { SettingAsset } from '@/types/settingAsset'
import { validateSettingBeforeStoryboard } from '@/features/editor/settingStoryboardState'

const sampleAsset = (id: string, type: SettingAsset['type']): SettingAsset => ({
  id,
  type,
  title: `${type}-${id}`,
  roleName: type === 'character' ? `role-${id}` : undefined,
  description: `description-${id}`,
  prompt: `prompt-${id}`,
  imageUrls: [`img-${id}`],
  candidateImages: [`cand-${id}`],
  selectedVoiceId: type === 'character' ? 'voice-1' : undefined,
  voiceOptions: type === 'character' ? [{ id: 'voice-1', name: '旁白' }] : undefined,
  status: 'ready',
  favorite: true,
  createdAt: '2026-03-12 17:16',
})

describe('settingStoryboardState', () => {
  it('blocks entering storyboard when there is no character', () => {
    expect(validateSettingBeforeStoryboard([sampleAsset('s1', 'scene')])).toEqual({
      ok: false,
      message: '请至少创建一个角色设定后再进入分镜',
    })
  })

  it('blocks entering storyboard when there is no scene', () => {
    expect(validateSettingBeforeStoryboard([sampleAsset('c1', 'character')])).toEqual({
      ok: false,
      message: '请至少创建一个场景设定后再进入分镜',
    })
  })

  it('allows entering storyboard when both character and scene exist', () => {
    expect(validateSettingBeforeStoryboard([sampleAsset('c1', 'character'), sampleAsset('s1', 'scene')])).toEqual({
      ok: true,
      message: '',
    })
  })
})
