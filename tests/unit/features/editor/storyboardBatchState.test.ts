import { describe, expect, it } from 'vitest'
import type { StoryboardShot } from '@/types/storyboard'
import {
  resolveStoryboardBatchAvailability,
  resolveStoryboardBatchTargetIds,
} from '@/features/editor/storyboardBatchState'

const makeShot = (overrides: Partial<StoryboardShot> = {}): StoryboardShot => ({
  id: overrides.id ?? 'shot-1',
  index: 1,
  title: '镜头 1',
  imageUrl: 'image-1',
  videoUrl: '',
  prompt: '画面描述',
  videoPrompt: '视频提示词',
  dialogue: '对白 1',
  durationSeconds: 10,
  voiceAssignments: [],
  attachments: [],
  characters: [],
  scenes: [],
  props: [],
  style: '写实',
  ratio: '16:9',
  status: 'pending-review',
  isHidden: false,
  isLocked: false,
  storyboardReviewed: false,
  referenceImages: [],
  createdAt: '2026-03-12 17:16',
  ...overrides,
})

describe('storyboardBatchState', () => {
  it('reports a clear reason when no shots are selected', () => {
    const result = resolveStoryboardBatchAvailability({
      shots: [makeShot({ id: 'shot-1' })],
      selectedShotIds: [],
      overwriteStrategy: 'skip-generated',
    })

    expect(result.canGenerate).toBe(false)
    expect(result.disabledReason).toBe('请先选择至少一个分镜')
  })

  it('returns target ids for selected available shots in shot order', () => {
    const shots = [
      makeShot({ id: 'shot-1', index: 1 }),
      makeShot({ id: 'shot-2', index: 2 }),
      makeShot({ id: 'shot-3', index: 3 }),
    ]

    const result = resolveStoryboardBatchAvailability({
      shots,
      selectedShotIds: ['shot-3', 'shot-1'],
      overwriteStrategy: 'skip-generated',
    })

    expect(result.canGenerate).toBe(true)
    expect(result.targetIds).toEqual(['shot-1', 'shot-3'])
  })

  it('skips generated shots when using skip-generated', () => {
    const result = resolveStoryboardBatchAvailability({
      shots: [
        makeShot({ id: 'shot-1', status: 'success' }),
        makeShot({ id: 'shot-2', status: 'failed' }),
        makeShot({ id: 'shot-3', status: 'pending-review' }),
      ],
      selectedShotIds: ['shot-1', 'shot-2', 'shot-3'],
      overwriteStrategy: 'skip-generated',
    })

    expect(result.generatedCount).toBe(1)
    expect(result.targetIds).toEqual(['shot-2', 'shot-3'])
  })

  it('reports when all selected shots are already generated', () => {
    const result = resolveStoryboardBatchAvailability({
      shots: [
        makeShot({ id: 'shot-1', status: 'success' }),
        makeShot({ id: 'shot-2', status: 'success' }),
      ],
      selectedShotIds: ['shot-1', 'shot-2'],
      overwriteStrategy: 'skip-generated',
    })

    expect(result.canGenerate).toBe(false)
    expect(result.disabledReason).toBe('当前选择的分镜均已生成，无需重复生成')
  })

  it('skips locked and hidden shots and reports when all selected shots are unavailable for those reasons', () => {
    const result = resolveStoryboardBatchAvailability({
      shots: [
        makeShot({ id: 'shot-1', isLocked: true }),
        makeShot({ id: 'shot-2', isHidden: true }),
      ],
      selectedShotIds: ['shot-1', 'shot-2'],
      overwriteStrategy: 'skip-generated',
    })

    expect(result.canGenerate).toBe(false)
    expect(result.lockedCount).toBe(1)
    expect(result.hiddenCount).toBe(1)
    expect(result.disabledReason).toBe('当前选择的分镜均已隐藏或锁定，无法批量生成')
  })

  it('keeps generated shots when using overwrite-generated', () => {
    const result = resolveStoryboardBatchAvailability({
      shots: [
        makeShot({ id: 'shot-1', status: 'success' }),
        makeShot({ id: 'shot-2', status: 'pending-review' }),
      ],
      selectedShotIds: ['shot-1', 'shot-2'],
      overwriteStrategy: 'overwrite-generated',
    })

    expect(result.targetIds).toEqual(['shot-1', 'shot-2'])
  })

  it('keeps resolveStoryboardBatchTargetIds compatible with the previous API', () => {
    const shots = [
      makeShot({ id: 'shot-1', status: 'success' }),
      makeShot({ id: 'shot-2', isLocked: true }),
      makeShot({ id: 'shot-3' }),
    ]

    expect(
      resolveStoryboardBatchTargetIds({
        shots,
        selectedShotIds: ['shot-1', 'shot-2', 'shot-3'],
        overwriteStrategy: 'skip-generated',
      }),
    ).toEqual(['shot-3'])
  })
})
