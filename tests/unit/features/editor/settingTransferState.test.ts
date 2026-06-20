import { describe, expect, it, vi } from 'vitest'
import {
  buildSettingArtifact,
  buildSettingBatchExportFileName,
  buildSettingExportFileName,
  buildSettingExportPayload,
} from '@/features/editor/settingTransferState'
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
        roleName: '冷面保镖',
        description: '沉稳寡言的贴身保镖',
        prompt: '冷静，黑发，长风衣',
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
        description: '带霓虹反光的旧街巷',
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
      characters: [{ id: 'character-1', name: '林秋', description: '沉稳寡言的贴身保镖' }],
      scenes: [{ id: 'scene-1', name: '旧街巷', description: '带霓虹反光的旧街巷' }],
      props: [],
    })

    vi.useRealTimers()
  })

  it('builds setting artifact envelope for selected assets only', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-06T12:00:00.000Z'))

    const assets: SettingAsset[] = [
      {
        id: 'character-1',
        type: 'character',
        title: '林秋',
        roleName: '冷面保镖',
        description: '沉稳寡言的贴身保镖',
        prompt: '冷静，黑发，长风衣',
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
        description: '带霓虹反光的旧街巷',
        prompt: '夜色，小雨，青石路',
        imageUrls: ['mock://scene'],
        candidateImages: [],
        status: 'ready',
        favorite: false,
        createdAt: '2026年3月12日 17:16',
      },
    ]

    expect(buildSettingArtifact('project-demo', [assets[1]])).toMatchObject({
      artifact: 'setting',
      projectId: 'project-demo',
      exportedAt: '2026-06-06T12:00:00.000Z',
      payload: {
        exportedAt: '2026-06-06T12:00:00.000Z',
        settingAssets: [assets[1]],
        characters: [],
        scenes: [{ id: 'scene-1', name: '旧街巷', description: '带霓虹反光的旧街巷' }],
        props: [],
      },
    })

    vi.useRealTimers()
  })

  it('builds safe export file name', () => {
    expect(buildSettingExportFileName('project:demo/01')).toBe('project-demo-01-setting.json')
  })

  it('builds batch export file name without placeholder suffix', () => {
    expect(buildSettingBatchExportFileName('project:demo/01')).toBe('project-demo-01-setting-batch.json')
  })
})
