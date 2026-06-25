import { describe, expect, it } from 'vitest'
import {
  isLocalAssetId,
  mapBackendAssetToSettingAsset,
  mapBackendAssetWorkspaceToSettingAssets,
  mapSettingAssetToBackendPayload,
} from '@/api/modules/editor/asset.mapper'

describe('asset.mapper', () => {
  it('maps backend CHARACTER assets into frontend character assets', () => {
    const asset = mapBackendAssetToSettingAsset({
      id: 101,
      type: 'CHARACTER',
      name: 'Hero',
      description: 'Lead character',
      imageUrl: 'https://example.com/hero.png',
      extraJson: JSON.stringify({
        prompt: 'anime hero portrait',
        favorite: true,
      }),
      favorite: false,
      createTime: '2026-06-25T10:00:00.000Z',
    })

    expect(asset).toMatchObject({
      id: '101',
      type: 'character',
      title: 'Hero',
      description: 'Lead character',
      prompt: 'anime hero portrait',
      imageUrls: ['https://example.com/hero.png'],
      favorite: true,
      createdAt: '2026-06-25T10:00:00.000Z',
    })
  })

  it.each([
    ['SCENE', 'scene'],
    ['PROP', 'prop'],
  ] as const)('maps backend %s assets into frontend %s assets', (backendType, frontendType) => {
    const asset = mapBackendAssetToSettingAsset({
      id: 202,
      type: backendType,
      name: 'Mapped asset',
      description: 'Mapped description',
    })

    expect(asset.type).toBe(frontendType)
  })

  it('maps frontend assets into backend payload strings', () => {
    const payload = mapSettingAssetToBackendPayload({
      id: 'asset-1',
      type: 'prop',
      title: 'Sword',
      description: 'Steel blade',
      prompt: 'silver fantasy sword',
      imageUrls: ['https://example.com/sword.png'],
      status: 'ready',
      favorite: true,
      createdAt: '2026-06-25T11:00:00.000Z',
    })

    expect(payload).toEqual({
      type: 'PROP',
      name: 'Sword',
      description: 'Steel blade',
      imageUrl: 'https://example.com/sword.png',
      extraJson: JSON.stringify({
        prompt: 'silver fantasy sword',
        favorite: true,
      }),
    })
  })

  it('detects local asset ids', () => {
    expect(isLocalAssetId('asset-1')).toBe(true)
    expect(isLocalAssetId('character-temp')).toBe(true)
    expect(isLocalAssetId('12')).toBe(false)
  })

  it('falls back safely when extraJson is invalid', () => {
    const asset = mapBackendAssetToSettingAsset({
      id: '12',
      type: 'SCENE',
      name: 'Street',
      description: 'Night street',
      extraJson: '{invalid-json',
      favorite: true,
    })

    expect(asset.prompt).toBe('')
    expect(asset.favorite).toBe(true)
  })

  it('falls back to top-level favorite when extraJson omits favorite', () => {
    const asset = mapBackendAssetToSettingAsset({
      id: '13',
      type: 'PROP',
      name: 'Lantern',
      description: 'Old lantern',
      extraJson: JSON.stringify({
        prompt: 'warm antique lantern',
      }),
      favorite: true,
    })

    expect(asset.prompt).toBe('warm antique lantern')
    expect(asset.favorite).toBe(true)
  })

  it('converts numeric backend ids into strings', () => {
    const asset = mapBackendAssetToSettingAsset({
      id: 7,
      type: 'PROP',
      name: 'Lantern',
      description: 'Old lantern',
    })

    expect(asset.id).toBe('7')
  })

  it('flattens backend workspace groups into setting assets', () => {
    const assets = mapBackendAssetWorkspaceToSettingAssets({
      characters: [{ id: 1, type: 'CHARACTER', name: 'Hero' }],
      scenes: [{ id: 2, type: 'SCENE', name: 'Street' }],
      props: [{ id: 3, type: 'PROP', name: 'Lantern' }],
      summary: { total: 3 },
    })

    expect(assets.map((asset) => [asset.id, asset.type, asset.title])).toEqual([
      ['1', 'character', 'Hero'],
      ['2', 'scene', 'Street'],
      ['3', 'prop', 'Lantern'],
    ])
  })
})
