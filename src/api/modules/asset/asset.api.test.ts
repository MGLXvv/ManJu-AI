import { beforeEach, describe, expect, it } from 'vitest'
import { resetLocalState } from '@/api/local'
import { assetApi } from './asset.api'

describe('modules/asset assetApi', () => {
  beforeEach(() => {
    resetLocalState()
  })

  it('lists empty assets before save and returns saved assets afterwards', async () => {
    const projectId = 'project-1'

    expect(await assetApi.list(projectId)).toEqual([])

    const saved = await assetApi.save(projectId, [
      {
        id: 'asset-1',
        type: 'character',
        name: 'Hero',
        prompt: 'Hero prompt',
        imageUrls: ['https://example.com/hero.png'],
        favorite: true,
      },
    ])

    expect(saved).toHaveLength(1)
    expect(await assetApi.list(projectId)).toEqual(saved)
  })
})
