import { describe, expect, it } from 'vitest'
import { generationWorkspaceRefreshService } from '@/services/generation/generationWorkspaceRefresh.service'
import type { DubbingRoleCardModel } from '@/types/dubbing'
import type { SettingAsset } from '@/types/settingAsset'
import type { StoryboardShot } from '@/types/storyboard'

const shot: StoryboardShot = {
  id: 'shot-1',
  index: 1,
  title: '镜头 1',
  prompt: '测试镜头',
  imageUrl: '/old.png',
  imageMediaId: 'media-old-image',
  videoUrl: '/old.mp4',
  videoMediaId: 'media-old-video',
  characters: [],
  scenes: [],
  props: [],
  style: '写实',
  ratio: '16:9',
  status: 'generating',
  referenceImages: [],
  createdAt: '2026-07-11T00:00:00.000Z',
}

const asset: SettingAsset = {
  id: 'asset-1',
  type: 'character',
  title: '角色',
  description: '',
  prompt: '角色提示词',
  imageUrls: ['blob:old-image'],
  imageMediaIds: ['media-old-image'],
  status: 'generating',
  createdAt: '2026-07-11T00:00:00.000Z',
}

describe('generationWorkspaceRefreshService', () => {
  it('hydrates lightweight storyboard and video results without full shots', async () => {
    const image = await generationWorkspaceRefreshService.resolveStoryboardImage('project-1', shot, {
      shotId: 'shot-1',
      imageUrl: '/generated.png',
    })
    const video = await generationWorkspaceRefreshService.resolveVideo('project-1', shot, {
      shotId: 'shot-1',
      videoUrl: '/generated.mp4',
    })

    expect(image.shot).toMatchObject({
      id: 'shot-1',
      imageUrl: '/generated.png',
      imageMediaId: undefined,
      status: 'success',
    })
    expect(video.shot).toMatchObject({
      id: 'shot-1',
      videoUrl: '/generated.mp4',
      videoMediaId: undefined,
      status: 'success',
    })
  })

  it('hydrates lightweight asset results while preserving existing uploaded media ids', async () => {
    const result = await generationWorkspaceRefreshService.resolveSettingAsset('project-1', asset, {
      assetId: 'asset-1',
      imageUrl: '/generated.png',
    })

    expect(result.asset.imageUrls).toEqual(['/generated.png', 'blob:old-image'])
    expect(result.asset.imageMediaIds).toEqual(['', 'media-old-image'])
    expect(result.asset.status).toBe('ready')
  })

  it('hydrates lightweight dubbing audio maps into the current card lines', () => {
    const card: DubbingRoleCardModel = {
      id: 'card-1',
      title: '角色',
      selectedVoiceId: 'voice-1',
      voiceOptions: [],
      createdAt: '2026-07-11T00:00:00.000Z',
      hidden: false,
      lines: [
        {
          id: 'line-1',
          shotId: 'shot-1',
          shotLabel: '镜头 1',
          text: '对白',
          status: 'generating',
        },
      ],
    }

    expect(
      generationWorkspaceRefreshService.resolveDubbing(card, {
        cardId: 'card-1',
        lineIds: ['line-1'],
        audioByLineId: { 'line-1': '/generated.mp3' },
      }),
    ).toEqual([
      expect.objectContaining({
        id: 'line-1',
        audioUrl: '/generated.mp3',
        status: 'success',
      }),
    ])
  })
})
