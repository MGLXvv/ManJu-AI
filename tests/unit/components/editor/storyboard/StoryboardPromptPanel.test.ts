import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import StoryboardPromptPanel from '@/components/editor/storyboard/StoryboardPromptPanel.vue'
import type { StoryboardShot, StoryboardTagOptions } from '@/types/storyboard'

const baseShot: StoryboardShot = {
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
  characters: [
    { id: 'char-1', name: '赵灵儿', type: 'character' },
    { id: 'char-2', name: '小龙女', type: 'character' },
  ],
  scenes: [
    { id: 'scene-1', name: '花店', type: 'scene' },
    { id: 'scene-2', name: '主角家', type: 'scene' },
  ],
  props: [
    { id: 'prop-1', name: '一束花', type: 'prop' },
    { id: 'prop-2', name: '古剑', type: 'prop' },
  ],
}

const renderComponent = async (props: any) =>
  renderToString(
    createSSRApp({
      render: () => h(StoryboardPromptPanel as any, props),
    }),
  )

describe('StoryboardPromptPanel', () => {
  it('renders insert mode controls and confirm action in multi-param mode', async () => {
    const html = await renderComponent({
      shot: baseShot,
      tagOptions,
      styleOptions: ['写实', '国风漫画'],
      mode: 'multi-param',
      insertMode: true,
      insertDraft: {
        characterIds: ['char-1'],
        sceneIds: ['scene-1'],
        propIds: [],
        prompt: '',
        style: '写实',
        ratio: '16:9',
      },
    })

    expect(html).toContain('插入新镜头')
    expect(html).toContain('确定')
    expect(html).not.toContain('生成镜头')
    expect(html).toContain('选择角色')
    expect(html).toContain('选择场景')
    expect(html).toContain('选择道具')
  })
})
