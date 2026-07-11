import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/api/http'
import { settingHttpApi } from '@/api/modules/setting/setting.http'
import { storyboardHttpApi } from '@/api/modules/storyboard/storyboard.http'
import { API_ERROR_CODES } from '@/types/api-enums'
import type { SettingAsset } from '@/types/settingAsset'
import type { StoryboardShot } from '@/types/storyboard'

vi.mock('@/api/http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

const asset: SettingAsset = {
  id: 'asset-1',
  type: 'character',
  title: '角色',
  description: '',
  prompt: '',
  imageUrls: [],
  status: 'empty',
  createdAt: '2026-07-11T00:00:00.000Z',
}

const shot: StoryboardShot = {
  id: 'shot-1',
  index: 1,
  title: '镜头 1',
  prompt: '测试镜头',
  characters: [],
  scenes: [],
  props: [],
  style: '写实',
  ratio: '16:9',
  status: 'pending-review',
  referenceImages: [],
  createdAt: '2026-07-11T00:00:00.000Z',
}

describe('media HTTP boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects Data URLs before calling the setting HTTP adapter', async () => {
    await expect(
      settingHttpApi.uploadAssetImage(asset, 'data:image/png;base64,bW9jaw=='),
    ).rejects.toMatchObject({
      code: API_ERROR_CODES.mediaUploadHttpUnsupported,
      status: 501,
    })
    expect(http.post).not.toHaveBeenCalled()
  })

  it('rejects Blob URLs before calling storyboard image and video endpoints', async () => {
    await expect(storyboardHttpApi.uploadShotImage(shot, 'blob:local-image')).rejects.toHaveProperty(
      'code',
      API_ERROR_CODES.mediaUploadHttpUnsupported,
    )
    await expect(storyboardHttpApi.uploadShotVideo(shot, 'blob:local-video')).rejects.toHaveProperty(
      'code',
      API_ERROR_CODES.mediaUploadHttpUnsupported,
    )
    expect(http.post).not.toHaveBeenCalled()
  })

  it('continues to accept stable backend-visible URLs', async () => {
    vi.mocked(http.post).mockResolvedValue({ data: { shot } })

    await storyboardHttpApi.uploadShotImage(shot, 'https://cdn.example.com/shot-1.png')

    expect(http.post).toHaveBeenCalledWith('/storyboard/shots/shot-1/image', {
      imageUrl: 'https://cdn.example.com/shot-1.png',
    })
  })
})
