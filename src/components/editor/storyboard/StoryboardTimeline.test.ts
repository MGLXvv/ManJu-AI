import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import StoryboardTimeline from './StoryboardTimeline.vue'
import type { StoryboardShot } from '@/types/storyboard'

const shots: StoryboardShot[] = [
  {
    id: 'shot-1',
    index: 1,
    title: '镜头 1',
    prompt: '镜头一',
    characters: [],
    scenes: [],
    props: [],
    style: '写实',
    ratio: '16:9',
    status: 'success',
    referenceImages: [],
    createdAt: '2026-03-12 17:16',
  },
  {
    id: 'shot-2',
    index: 2,
    title: '镜头 2',
    prompt: '镜头二',
    characters: [],
    scenes: [],
    props: [],
    style: '写实',
    ratio: '16:9',
    status: 'pending-review',
    referenceImages: [],
    createdAt: '2026-03-12 17:16',
  },
]

const renderComponent = async (props: any) =>
  renderToString(
    createSSRApp({
      render: () => h(StoryboardTimeline as any, props),
    }),
  )

describe('StoryboardTimeline', () => {
  it('renders an insert card after the selected shot in multi-param mode', async () => {
    const html = await renderComponent({
      shots,
      activeShotId: 'shot-1',
      mode: 'multi-param',
      insertAfterShotId: 'shot-1',
    })

    expect(html).toContain('插入新镜头')
  })
})
