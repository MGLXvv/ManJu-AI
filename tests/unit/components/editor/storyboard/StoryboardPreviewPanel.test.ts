import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import StoryboardPreviewPanel from '@/components/editor/storyboard/StoryboardPreviewPanel.vue'
import type { StoryboardShot } from '@/types/storyboard'

const baseShot: StoryboardShot = {
  id: 'shot-1',
  index: 1,
  title: '镜头 1',
  imageUrl: 'data:image/svg+xml;charset=UTF-8,test',
  prompt: '测试镜头',
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
  videoUrl: '',
  isHidden: false,
  isLocked: false,
  storyboardReviewed: false,
}

const renderComponent = async (props: any) =>
  renderToString(
    createSSRApp({
      render: () => h(StoryboardPreviewPanel as any, props),
    }),
  )

describe('StoryboardPreviewPanel', () => {
  it('renders a multi-param placeholder instead of the image preview', async () => {
    const html = await renderComponent({
      shot: baseShot,
      mode: 'multi-param',
    })

    expect(html).toContain('多参模式，无图片生成')
    expect(html).not.toContain('<img')
    expect(html).not.toContain('当前镜头暂无预览图')
  })

  it('marks portrait storyboard previews with a portrait stage class', async () => {
    const html = await renderComponent({
      shot: { ...baseShot, ratio: '9:16' },
      mode: 'image',
    })

    expect(html).toContain('storyboard-canvas__stage')
    expect(html).toContain('is-portrait')
  })
})