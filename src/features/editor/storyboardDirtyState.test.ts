import { describe, expect, it } from 'vitest'
import type { StoryboardShot } from '@/types/storyboard'
import { buildStoryboardDraftSnapshot, hasUnsavedStoryboardChanges } from './storyboardDirtyState'

const sampleShot = (): StoryboardShot => ({
  id: 'shot-1',
  index: 1,
  title: '镜头 1',
  imageUrl: 'image-1',
  videoUrl: 'mock-video://shot-1/1',
  prompt: '提示词 1',
  videoPrompt: '视频提示词 1',
  dialogue: '对白 1',
  durationSeconds: 10,
  voiceAssignments: [],
  characters: [{ id: 'ch-1', name: '赵灵儿', type: 'character' }],
  scenes: [{ id: 'sc-1', name: '花店', type: 'scene' }],
  props: [{ id: 'pr-1', name: '一束花', type: 'prop' }],
  style: '国风漫画',
  ratio: '16:9',
  status: 'success',
  isHidden: false,
  isLocked: false,
  isFavorite: false,
  referenceImages: [{ id: 'ref-1', url: 'ref-image-1' }],
  createdAt: '2026年3月12日 17:16',
})

describe('storyboardDirtyState', () => {
  it('builds stable snapshot from storyboard shots', () => {
    expect(buildStoryboardDraftSnapshot([sampleShot()])).toBe(
      JSON.stringify([
        {
          id: 'shot-1',
          index: 1,
          title: '镜头 1',
          description: '提示词 1',
          characterIds: ['ch-1'],
          sceneIds: ['sc-1'],
          propIds: ['pr-1'],
          imageUrl: 'image-1',
          videoUrl: 'mock-video://shot-1/1',
          videoPrompt: '视频提示词 1',
          dialogue: '对白 1',
          durationSeconds: 10,
          voiceAssignments: [],
          status: 'success',
          style: '国风漫画',
          ratio: '16:9',
          isHidden: false,
          isLocked: false,
          isFavorite: false,
          referenceImages: [{ id: 'ref-1', url: 'ref-image-1' }],
          createdAt: '2026年3月12日 17:16',
        },
      ]),
    )
  })

  it('detects unsaved changes by comparing snapshots', () => {
    const shots = [sampleShot()]
    const lastSavedSnapshot = buildStoryboardDraftSnapshot(shots)

    expect(hasUnsavedStoryboardChanges(lastSavedSnapshot, shots)).toBe(false)
    expect(
      hasUnsavedStoryboardChanges(lastSavedSnapshot, [
        {
          ...sampleShot(),
          prompt: '提示词 2',
        },
      ]),
    ).toBe(true)
    expect(
      hasUnsavedStoryboardChanges(lastSavedSnapshot, [
        {
          ...sampleShot(),
          isHidden: true,
        },
      ]),
    ).toBe(true)
  })
})
