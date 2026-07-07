import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import VideoPreviewPanel from '@/components/editor/video/VideoPreviewPanel.vue'
import { MOCK_MEDIA_VIDEO_9_16_URL } from '@/mocks/mockMedia'
import type { StoryboardShot } from '@/types/storyboard'

const baseShot: StoryboardShot = {
  id: 'shot-1',
  index: 1,
  title: '镜头 1',
  prompt: '测试提示词',
  videoPrompt: '',
  dialogue: '',
  durationSeconds: 10,
  voiceAssignments: [],
  attachments: [],
  characters: [],
  scenes: [],
  props: [],
  style: '写实',
  ratio: '16:9',
  status: 'success',
  referenceImages: [],
  createdAt: '2026-03-12 17:16',
  imageUrl: 'data:image/svg+xml;charset=UTF-8,test',
  videoUrl: MOCK_MEDIA_VIDEO_9_16_URL,
  isHidden: false,
  isLocked: false,
  storyboardReviewed: false,
}

describe('VideoPreviewPanel', () => {
  it('marks portrait video previews and eagerly preloads the video element', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(VideoPreviewPanel as any, {
            shot: { ...baseShot, ratio: '9:16' },
          }),
      }),
    )

    expect(html).toContain('video-preview-panel__stage')
    expect(html).toContain('is-portrait')
    expect(html).toContain('preload="auto"')
  })
})