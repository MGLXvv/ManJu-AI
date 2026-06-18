import { describe, expect, it } from 'vitest'
import type { StoryboardShot } from '@/types/storyboard'
import {
  canBatchGenerateVideoShot,
  resolveSelectableVideoBatchShotIds,
  resolveVideoBatchGenerateTargets,
} from './videoBatchState'

const makeShot = (overrides: Partial<StoryboardShot> = {}): StoryboardShot => ({
  id: overrides.id ?? 'shot-1',
  index: overrides.index ?? 1,
  title: overrides.title ?? 'Shot 1',
  imageUrl: overrides.imageUrl ?? 'image-1',
  videoUrl: overrides.videoUrl ?? '',
  prompt: overrides.prompt ?? 'Prompt 1',
  videoPrompt: overrides.videoPrompt ?? 'Video prompt 1',
  dialogue: overrides.dialogue ?? 'Dialogue 1',
  durationSeconds: overrides.durationSeconds ?? 10,
  voiceAssignments: overrides.voiceAssignments ?? [],
  attachments: overrides.attachments ?? [],
  characters: overrides.characters ?? [],
  scenes: overrides.scenes ?? [],
  props: overrides.props ?? [],
  style: overrides.style ?? 'Comic',
  ratio: overrides.ratio ?? '16:9',
  status: overrides.status ?? 'pending-review',
  isHidden: overrides.isHidden ?? false,
  isLocked: overrides.isLocked ?? false,
  isFavorite: overrides.isFavorite ?? false,
  referenceImages: overrides.referenceImages ?? [],
  createdAt: overrides.createdAt ?? '2026-03-12 17:16',
})

describe('videoBatchState', () => {
  it('allows only unlocked, visible, non-generated, non-generating shots into batch generation', () => {
    expect(canBatchGenerateVideoShot(makeShot())).toBe(true)
    expect(canBatchGenerateVideoShot(makeShot({ videoUrl: 'mock-video://1' }))).toBe(false)
    expect(canBatchGenerateVideoShot(makeShot({ isLocked: true }))).toBe(false)
    expect(canBatchGenerateVideoShot(makeShot({ isHidden: true }))).toBe(false)
    expect(canBatchGenerateVideoShot(makeShot({ status: 'generating' }))).toBe(false)
  })

  it('returns only selected eligible shots for batch generation', () => {
    const shots = [
      makeShot({ id: 'shot-1' }),
      makeShot({ id: 'shot-2', videoUrl: 'mock-video://2' }),
      makeShot({ id: 'shot-3', isLocked: true }),
      makeShot({ id: 'shot-4', isHidden: true }),
      makeShot({ id: 'shot-5', status: 'generating' }),
    ]

    expect(resolveVideoBatchGenerateTargets(shots, ['shot-1', 'shot-2', 'shot-3', 'shot-4', 'shot-5']).map((shot) => shot.id)).toEqual([
      'shot-1',
    ])
  })

  it('returns only eligible ids for select all', () => {
    const shots = [
      makeShot({ id: 'shot-1' }),
      makeShot({ id: 'shot-2', videoUrl: 'mock-video://2' }),
      makeShot({ id: 'shot-3', isLocked: true }),
      makeShot({ id: 'shot-4', isHidden: true }),
      makeShot({ id: 'shot-5', status: 'generating' }),
      makeShot({ id: 'shot-6' }),
    ]

    expect(resolveSelectableVideoBatchShotIds(shots)).toEqual(['shot-1', 'shot-6'])
  })
})
