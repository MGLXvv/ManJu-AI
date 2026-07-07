import { describe, expect, it } from 'vitest'
import type { StoryboardShot } from '@/types/storyboard'
import {
  canBatchGenerateVideoShot,
  resolveSelectableVideoBatchShotIds,
  resolveVideoBatchAvailability,
  resolveVideoBatchGenerateTargets,
  resolveVideoBatchTargetIds,
} from '@/features/editor/videoBatchState'

const buildShot = (patch: Partial<StoryboardShot> = {}): StoryboardShot => ({
  id: patch.id ?? 'shot-1',
  index: patch.index ?? 1,
  title: patch.title ?? '镜头 1',
  imageUrl: patch.imageUrl ?? 'image.png',
  videoUrl: patch.videoUrl ?? '',
  prompt: patch.prompt ?? '画面描述',
  videoPrompt: patch.videoPrompt ?? '视频提示词',
  dialogue: patch.dialogue ?? '',
  durationSeconds: patch.durationSeconds ?? 10,
  voiceAssignments: patch.voiceAssignments ?? [],
  attachments: patch.attachments ?? [],
  characters: patch.characters ?? [],
  scenes: patch.scenes ?? [],
  props: patch.props ?? [],
  style: patch.style ?? '写实',
  ratio: patch.ratio ?? '16:9',
  status: patch.status ?? 'pending-review',
  isHidden: patch.isHidden ?? false,
  isLocked: patch.isLocked ?? false,
  storyboardReviewed: patch.storyboardReviewed ?? false,
  referenceImages: patch.referenceImages ?? [],
  createdAt: patch.createdAt ?? '2026-03-12 17:16',
})

describe('videoBatchState', () => {
  it('disables batch generation when no shots are selected', () => {
    const availability = resolveVideoBatchAvailability({
      shots: [buildShot({ id: 'shot-1' })],
      selectedShotIds: [],
    })

    expect(availability.canGenerate).toBe(false)
    expect(availability.disabledReason).toBe('请先选择至少一个分镜')
  })

  it('returns target ids for selected shots with image and without video', () => {
    const availability = resolveVideoBatchAvailability({
      shots: [buildShot({ id: 'shot-1' }), buildShot({ id: 'shot-2', videoUrl: 'video.mp4' })],
      selectedShotIds: ['shot-2', 'shot-1'],
    })

    expect(availability.targetIds).toEqual(['shot-1'])
    expect(resolveVideoBatchGenerateTargets(
      [buildShot({ id: 'shot-1' }), buildShot({ id: 'shot-2', videoUrl: 'video.mp4' })],
      ['shot-2', 'shot-1'],
    ).map((shot) => shot.id)).toEqual(['shot-1'])
  })

  it('skips shots without images and reports missing image reason', () => {
    const shots = [buildShot({ id: 'shot-1', imageUrl: '' }), buildShot({ id: 'shot-2', imageUrl: '' })]

    const availability = resolveVideoBatchAvailability({
      shots,
      selectedShotIds: ['shot-1', 'shot-2'],
    })

    expect(availability.missingImageCount).toBe(2)
    expect(availability.targetIds).toEqual([])
    expect(availability.disabledReason).toBe('当前选择的分镜均缺少图片，请先生成或上传分镜图')
  })

  it('skips hidden and locked shots and reports the reason when all are unavailable', () => {
    const shots = [buildShot({ id: 'shot-1', isHidden: true }), buildShot({ id: 'shot-2', isLocked: true })]

    const availability = resolveVideoBatchAvailability({
      shots,
      selectedShotIds: ['shot-1', 'shot-2'],
    })

    expect(availability.hiddenCount).toBe(1)
    expect(availability.lockedCount).toBe(1)
    expect(availability.disabledReason).toBe('当前选择的分镜均已隐藏或锁定，无法批量生成视频')
  })

  it('skips generated shots by default and reports when all selected shots already have videos', () => {
    const shots = [buildShot({ id: 'shot-1', videoUrl: 'video-1.mp4' }), buildShot({ id: 'shot-2', videoUrl: 'video-2.mp4' })]

    const availability = resolveVideoBatchAvailability({
      shots,
      selectedShotIds: ['shot-1', 'shot-2'],
    })

    expect(availability.generatedCount).toBe(2)
    expect(availability.disabledReason).toBe('当前选择的分镜均已生成视频，无需重复生成')
  })

  it('allows generated shots when overwrite is enabled', () => {
    const shots = [buildShot({ id: 'shot-1', videoUrl: 'video-1.mp4' }), buildShot({ id: 'shot-2' })]

    const availability = resolveVideoBatchAvailability({
      shots,
      selectedShotIds: ['shot-1', 'shot-2'],
      overwriteGenerated: true,
    })

    expect(availability.targetIds).toEqual(['shot-1', 'shot-2'])
  })

  it('keeps compatibility helpers aligned with the new availability logic', () => {
    const shots = [
      buildShot({ id: 'shot-1' }),
      buildShot({ id: 'shot-2', imageUrl: '' }),
      buildShot({ id: 'shot-3', videoUrl: 'video-3.mp4' }),
      buildShot({ id: 'shot-4', isLocked: true }),
      buildShot({ id: 'shot-5', isHidden: true }),
      buildShot({ id: 'shot-6', status: 'generating' }),
    ]

    expect(canBatchGenerateVideoShot(buildShot())).toBe(true)
    expect(canBatchGenerateVideoShot(buildShot({ imageUrl: '' }))).toBe(false)
    expect(resolveSelectableVideoBatchShotIds(shots)).toEqual(['shot-1'])
    expect(resolveVideoBatchTargetIds({ shots, selectedShotIds: ['shot-1', 'shot-2', 'shot-3'] })).toEqual(['shot-1'])
  })
})
