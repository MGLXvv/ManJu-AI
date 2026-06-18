import { describe, expect, it } from 'vitest'
import { createDefaultEditorDraft } from '@/mocks/editor.mock'
import type { SettingAsset } from '@/types/settingAsset'
import { buildSettingAssetsSnapshot, buildSettingDraftPatch, resolveSettingAssets } from './settingDraftState'

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

describe('settingDraftState', () => {
  it('uses fallback assets when draft has no saved setting assets', () => {
    const fallback = [sampleAsset('1', 'character')]
    const draft = createDefaultEditorDraft('project-1')

    expect(resolveSettingAssets(draft, fallback)).toEqual(fallback)
  })

  it('prefers saved setting assets from draft', () => {
    const fallback = [sampleAsset('1', 'character')]
    const draft = createDefaultEditorDraft('project-1')
    draft.settingAssets = [sampleAsset('2', 'scene')]

    expect(resolveSettingAssets(draft, fallback)).toEqual(draft.settingAssets)
  })

  it('builds full draft patch and derives summaries by asset type', () => {
    const assets = [sampleAsset('c1', 'character'), sampleAsset('s1', 'scene'), sampleAsset('p1', 'prop')]

    expect(buildSettingDraftPatch(assets)).toEqual({
      settingAssets: assets,
      characters: [{ id: 'c1', name: 'character-c1', description: 'description-c1' }],
      scenes: [{ id: 's1', name: 'scene-s1', description: 'description-s1' }],
      props: [{ id: 'p1', name: 'prop-p1', description: 'description-p1' }],
    })
  })

  it('builds a stable snapshot for identical assets', () => {
    const assets = [sampleAsset('c1', 'character')]
    expect(buildSettingAssetsSnapshot(assets)).toBe(buildSettingAssetsSnapshot([sampleAsset('c1', 'character')]))
  })
})
