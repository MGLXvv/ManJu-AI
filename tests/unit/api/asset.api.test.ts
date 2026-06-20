import { beforeEach, describe, expect, it } from 'vitest'
import { resetLocalState } from '@/api/local'
import { assetApi } from '@/api/asset.api'
import { assetApi as moduleAssetApi } from '@/api/modules/asset'

describe('asset api', () => {
  beforeEach(() => {
    resetLocalState()
  })

  it('re-exports the module-level asset api for compatibility', () => {
    expect(assetApi).toBe(moduleAssetApi)
  })

  it('preserves list/save behavior through the compatibility entry', async () => {
    const projectId = 'project-asset'

    const saved = await assetApi.save(projectId, [
      {
        id: 'asset-1',
        type: 'scene',
        name: 'Dock',
        prompt: 'Foggy dock at dawn',
        imageUrls: [],
        favorite: false,
      },
    ])

    expect(saved).toHaveLength(1)
    expect(await assetApi.list(projectId)).toEqual(saved)
  })
})
