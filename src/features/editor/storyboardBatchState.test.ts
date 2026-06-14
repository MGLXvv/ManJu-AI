import { describe, expect, it } from 'vitest'
import type { StoryboardShot } from '@/types/storyboard'
import { resolveStoryboardBatchTargetIds } from './storyboardBatchState'

const makeShot = (overrides: Partial<StoryboardShot> = {}): StoryboardShot => ({
  id: 'shot-1',
  index: 1,
  title: '镜头 1',
  imageUrl: 'image-1',
  videoUrl: '',
  prompt: '提示词 1',
  videoPrompt: '视频提示词 1',
  dialogue: '对白 1',
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
  isFavorite: false,
  referenceImages: [],
  createdAt: '2026年3月12日 17:16',
  ...overrides,
})

describe('storyboardBatchState', () => {
  it('resolves selected target ids in shot order while filtering hidden and locked shots', () => {
    const shots = [
      makeShot({ id: 'shot-1', index: 1 }),
      makeShot({ id: 'shot-2', index: 2, isHidden: true }),
      makeShot({ id: 'shot-3', index: 3, isLocked: true }),
      makeShot({ id: 'shot-4', index: 4 }),
    ]

    expect(
      resolveStoryboardBatchTargetIds({
        shots,
        selectedShotIds: ['shot-4', 'shot-3', 'shot-2', 'shot-1'],
        overwriteStrategy: 'overwrite-generated',
      }),
    ).toEqual(['shot-1', 'shot-4'])
  })

  it('skips already generated shots when using skip-generated', () => {
    const shots = [
      makeShot({ id: 'shot-1', status: 'success' }),
      makeShot({ id: 'shot-2', status: 'failed' }),
      makeShot({ id: 'shot-3', status: 'pending-review' }),
    ]

    expect(
      resolveStoryboardBatchTargetIds({
        shots,
        selectedShotIds: ['shot-1', 'shot-2', 'shot-3'],
        overwriteStrategy: 'skip-generated',
      }),
    ).toEqual(['shot-2', 'shot-3'])
  })

  it('keeps generated shots when using overwrite-generated', () => {
    const shots = [
      makeShot({ id: 'shot-1', status: 'success' }),
      makeShot({ id: 'shot-2', status: 'pending-review' }),
    ]

    expect(
      resolveStoryboardBatchTargetIds({
        shots,
        selectedShotIds: ['shot-1', 'shot-2'],
        overwriteStrategy: 'overwrite-generated',
      }),
    ).toEqual(['shot-1', 'shot-2'])
  })
})
