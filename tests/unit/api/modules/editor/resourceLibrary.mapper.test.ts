import { describe, expect, it } from 'vitest'
import { mapResourceLibraryItemToSettingAsset } from '@/api/modules/editor/resourceLibrary.mapper'

describe('resourceLibrary.mapper', () => {
  it('maps backend resource library items into setting assets', () => {
    const asset = mapResourceLibraryItemToSettingAsset({
      id: 9,
      assetType: 'CHARACTER',
      name: 'Library Hero',
      description: 'saved asset',
      imageUrl: 'https://example.com/hero.png',
      extraJson: JSON.stringify({ prompt: 'hero prompt', favorite: true }),
      createTime: '2026-06-25T00:00:00.000Z',
    })

    expect(asset).toMatchObject({
      id: '9',
      type: 'character',
      title: 'Library Hero',
      prompt: 'hero prompt',
      favorite: true,
      imageUrls: ['https://example.com/hero.png'],
      status: 'ready',
      createdAt: '2026-06-25T00:00:00.000Z',
    })
  })

  it('falls back safely when extraJson is invalid', () => {
    const asset = mapResourceLibraryItemToSettingAsset({
      id: 2,
      assetType: 'SCENE',
      name: 'Night Street',
      extraJson: '{invalid-json',
    })

    expect(asset.type).toBe('scene')
    expect(asset.prompt).toBe('')
    expect(asset.favorite).toBe(false)
  })
})
