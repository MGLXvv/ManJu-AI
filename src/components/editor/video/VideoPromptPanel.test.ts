import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import VideoPromptPanel from './VideoPromptPanel.vue'
import type { StoryboardShot, StoryboardTag } from '@/types/storyboard'

const availableCharacters: StoryboardTag[] = [
  { id: 'char-1', name: '许红豆', type: 'character' },
  { id: 'char-2', name: '娜娜', type: 'character' },
  { id: 'char-3', name: '虚妄', type: 'character' },
]

const shot: StoryboardShot = {
  id: 'shot-1',
  index: 1,
  title: '镜头 1',
  prompt: '测试视频提示词',
  videoPrompt: '夜景街道，角色对话，镜头缓慢推进。',
  dialogue: '这是对白内容',
  durationSeconds: 10,
  voiceAssignments: [
    { id: 'voice-1', characterId: 'char-1', voice: '温柔女中音' },
    { id: 'voice-2', characterId: 'char-2', voice: '可爱女声音' },
  ],
  attachments: [],
  characters: [
    { id: 'char-1', name: '许红豆', type: 'character' },
    { id: 'char-2', name: '娜娜', type: 'character' },
  ],
  scenes: [],
  props: [],
  style: '写实',
  ratio: '16:9',
  status: 'pending-review',
  referenceImages: [],
  createdAt: '2026-03-12 17:16',
}

const renderComponent = async () =>
  renderToString(
    createSSRApp({
      render: () =>
        h(VideoPromptPanel as any, {
          shot,
          availableCharacters,
        }),
    }),
  )

describe('VideoPromptPanel', () => {
  it('renders inline row actions for each existing voice row', async () => {
    const html = await renderComponent()

    expect(html).toContain('video-voice-table__header')
    expect(html.match(/aria-label="新增角色音色行"/g)?.length).toBe(2)
    expect(html.match(/aria-label="复制角色音色行"/g)?.length).toBe(2)
    expect(html.match(/aria-label="删除角色音色"/g)?.length).toBe(2)
  })

  it('renders demo rows plus one editable draft row when there is no saved voice assignment', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(VideoPromptPanel as any, {
            shot: {
              ...shot,
              voiceAssignments: [],
              characters: [],
            },
            availableCharacters,
          }),
      }),
    )

    expect(html).toContain('许红豆')
    expect(html).toContain('娜娜')
    expect(html.match(/video-voice-table__row--draft/g)?.length).toBeGreaterThanOrEqual(1)
    expect(html.match(/确认/g)?.length).toBeGreaterThan(0)
    expect(html.match(/删除/g)?.length).toBeGreaterThan(0)
  })
})
