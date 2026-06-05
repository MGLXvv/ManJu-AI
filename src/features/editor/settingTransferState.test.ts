import { describe, expect, it, vi } from 'vitest'
import type { SettingAsset } from '@/types/settingAsset'
import { buildSettingExportFileName, buildSettingExportPayload } from './settingTransferState'

const sampleAsset = (id: string, type: SettingAsset['type']): SettingAsset => ({
  id,
  type,
  title: `${type}-${id}`,
  prompt: `prompt-${id}`,
  imageUrls: [`img-${id}`],
  candidateImages: [`cand-${id}`],
  selectedVoiceId: type === 'character' ? 'voice-1' : undefined,
  voiceOptions: type === 'character' ? [{ id: 'voice-1', name: '旁白' }] : undefined,
  status: 'ready',
  favorite: true,
  createdAt: '2026-03-12 17:16',
})

describe('settingTransferState', () => {
  it('builds export payload from assets', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-05T09:00:00.000Z'))

    const payload = buildSettingExportPayload([sampleAsset('c1', 'character'), sampleAsset('s1', 'scene')])

    expect(payload).toMatchObject({
      exportedAt: '2026-06-05T09:00:00.000Z',
      characters: [{ id: 'c1', name: 'character-c1', description: 'prompt-c1' }],
      scenes: [{ id: 's1', name: 'scene-s1', description: 'prompt-s1' }],
      props: [],
    })

    vi.useRealTimers()
  })

  it('builds safe export file name', () => {
    expect(buildSettingExportFileName('project:demo/01')).toBe('project-demo-01-assets.json')
  })
})
