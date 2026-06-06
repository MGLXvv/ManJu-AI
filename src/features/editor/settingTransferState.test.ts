import { describe, expect, it, vi } from 'vitest'
import { buildSettingExportFileName, buildSettingExportPayload } from './settingTransferState'
import type { SettingAsset } from '@/types/settingAsset'

describe('settingTransferState', () => {
  it('builds export payload with derived setting entities', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-06T12:00:00.000Z'))

    const assets: SettingAsset[] = [
      {
        id: 'character-1',
        type: 'character',
        title: '林秋',
        prompt: '冷静，黑发，长风衣',
        roleName: '角色音色',
        imageUrls: ['mock://character'],
        candidateImages: [],
        status: 'ready',
        favorite: false,
        createdAt: '2026年3月12日 17:16',
        selectedVoiceId: 'male-mid-deep',
        voiceOptions: [{ id: 'male-mid-deep', name: '浑厚男中音', duration: '00:30' }],
      },
      {
        id: 'scene-1',
        type: 'scene',
        title: '旧街巷',
        prompt: '夜色，小雨，青石路',
        imageUrls: ['mock://scene'],
        candidateImages: [],
        status: 'ready',
        favorite: false,
        createdAt: '2026年3月12日 17:16',
      },
    ]

    expect(buildSettingExportPayload(assets)).toMatchObject({
      exportedAt: '2026-06-06T12:00:00.000Z',
      characters: [{ id: 'character-1', name: '林秋', description: '冷静，黑发，长风衣' }],
      scenes: [{ id: 'scene-1', name: '旧街巷', description: '夜色，小雨，青石路' }],
      props: [],
    })

    vi.useRealTimers()
  })

  it('builds safe export file name', () => {
    expect(buildSettingExportFileName('project:demo/01')).toBe('project-demo-01-setting.json')
  })
})
