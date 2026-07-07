import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import StoryboardShotCard from '@/components/editor/storyboard/StoryboardShotCard.vue'
import type { StoryboardShot } from '@/types/storyboard'

const buildShot = (overrides: Partial<StoryboardShot> = {}): StoryboardShot => ({
  id: 'shot-1',
  index: 1,
  title: '镜头 1',
  imageUrl: 'mock-image',
  videoUrl: '',
  prompt: '提示词',
  videoPrompt: '',
  dialogue: '',
  durationSeconds: 10,
  voiceAssignments: [],
  characters: [],
  scenes: [],
  props: [],
  style: '国风漫画',
  ratio: '16:9',
  status: 'pending-review',
  isHidden: false,
  isLocked: false,
  storyboardReviewed: false,
  referenceImages: [],
  createdAt: '2026年3月12日 17:16',
  ...overrides,
})

describe('StoryboardShotCard', () => {
  it('shows a loading state when the shot is generating', async () => {
    const app = createSSRApp({
      render: () =>
        h(StoryboardShotCard, {
          shot: buildShot({
            imageUrl: '',
            status: 'generating',
          }),
          active: false,
        }),
    })

    const html = await renderToString(app)

    expect(html).toContain('镜头生成中')
  })
})
