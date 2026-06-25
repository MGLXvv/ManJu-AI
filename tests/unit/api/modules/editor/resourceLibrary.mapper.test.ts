import { describe, expect, it } from 'vitest'
import {
  mapBackendResourceLibraryPage,
  mapResourceLibraryItemToSettingAsset,
  mapResourceLibraryTypeQuery,
} from '@/api/modules/editor/resourceLibrary.mapper'

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

  it('maps query type values for backend requests', () => {
    expect(mapResourceLibraryTypeQuery('character')).toBe('CHARACTER')
    expect(mapResourceLibraryTypeQuery('scene')).toBe('SCENE')
    expect(mapResourceLibraryTypeQuery('prop')).toBe('PROP')
    expect(mapResourceLibraryTypeQuery('all')).toBeUndefined()
    expect(mapResourceLibraryTypeQuery()).toBeUndefined()
  })

  it('maps paged resource library payloads', () => {
    const result = mapBackendResourceLibraryPage({
      list: [
        {
          id: 8,
          assetType: 'PROP',
          name: 'Lantern',
          extraJson: JSON.stringify({ prompt: 'warm lantern' }),
        },
      ],
      total: 11,
    })

    expect(result.total).toBe(11)
    expect(result.items[0]).toMatchObject({
      id: '8',
      type: 'prop',
      title: 'Lantern',
      prompt: 'warm lantern',
    })
  })

  it('maps array resource library payloads', () => {
    const result = mapBackendResourceLibraryPage([
      {
        id: 6,
        type: 'SCENE',
        name: 'Alley',
      },
    ])

    expect(result.total).toBe(1)
    expect(result.items[0]).toMatchObject({
      id: '6',
      type: 'scene',
      title: 'Alley',
    })
  })
})
