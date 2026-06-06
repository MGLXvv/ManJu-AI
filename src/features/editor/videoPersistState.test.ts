import { describe, expect, it } from 'vitest'
import type { StoryboardShot } from '@/types/storyboard'
import { buildVideoExportFileName, validateVideoBeforeDubbing } from './videoPersistState'

const makeShot = (overrides: Partial<StoryboardShot> = {}): StoryboardShot => ({
  id: 'shot-1',
  index: 1,
  title: '镜头 1',
  imageUrl: 'image-1',
  videoUrl: '',
  prompt: '提示词',
  videoPrompt: '视频提示词',
  dialogue: '对白',
  durationSeconds: 10,
  voiceAssignments: [{ characterId: 'ch-1', voice: '浑厚男中音' }],
  characters: [{ id: 'ch-1', name: '赵灵儿', type: 'character' }],
  scenes: [{ id: 'sc-1', name: '花店', type: 'scene' }],
  props: [],
  style: '国风漫画',
  ratio: '16:9',
  status: 'idle',
  referenceImages: [],
  createdAt: '2026年3月12日 17:16',
  ...overrides,
})

describe('videoPersistState', () => {
  it('builds safe export file name', () => {
    expect(buildVideoExportFileName('project:demo/01')).toBe('project-demo-01-video.json')
  })

  it('blocks entering dubbing when no generated video exists', () => {
    expect(validateVideoBeforeDubbing([makeShot()])).toEqual({
      ok: false,
      message: '请至少生成一个视频镜头后再进入配音',
    })
  })

  it('allows entering dubbing when at least one shot has video url', () => {
    expect(validateVideoBeforeDubbing([makeShot({ videoUrl: 'mock-video://shot-1/2', status: 'success' })])).toEqual({
      ok: true,
      message: '',
    })
  })
})
