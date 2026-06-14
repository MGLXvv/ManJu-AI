import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import StoryboardPromptPanel from './StoryboardPromptPanel.vue'
import type { StoryboardShot, StoryboardTagOptions } from '@/types/storyboard'

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
  createdAt: '2026-03-12 17:16',
}

const tagOptions: StoryboardTagOptions = {
  characters: [],
  scenes: [],
  props: [],
}

const renderComponent = async (props: any) =>
  renderToString(
    createSSRApp({
      render: () => h(StoryboardPromptPanel as any, props),
    }),
  )

describe('StoryboardPromptPanel collapse', () => {
  it('renders only the collapse handle in collapsed mode', async () => {
    const html = await renderComponent({
      shot,
      tagOptions,
      styleOptions: ['写实'],
      collapsed: true,
    })

    expect(html).toContain('展开左侧操作台')
    expect(html).not.toContain('画面描述')
    expect(html).not.toContain('图像风格')
  })
})
