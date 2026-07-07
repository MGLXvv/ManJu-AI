import { describe, expect, it } from 'vitest'
import {
  resolveMissingMultiParamFields,
  validateMultiParamShotParameters,
} from '@/features/editor/storyboardParameterValidationState'
import type { StoryboardShot } from '@/types/storyboard'

describe('storyboardParameterValidationState', () => {
  it('accepts legacy description content when prompt is absent', () => {
    const legacyLikeShot = {
      id: 'shot-1',
      index: 1,
      title: 'shot 1',
      description: 'character looks back in the rain',
      characterIds: ['ch-1'],
      sceneIds: ['sc-1'],
      propIds: [],
      characters: [],
      scenes: [],
      props: [],
      style: 'style',
      ratio: '16:9',
      status: 'pending-review',
      storyboardReviewed: true,
      referenceImages: [],
      createdAt: '2026-03-12 17:16',
    } as StoryboardShot & {
      description: string
      characterIds: string[]
      sceneIds: string[]
      propIds: string[]
      prompt?: string
    }

    expect(resolveMissingMultiParamFields(legacyLikeShot as StoryboardShot)).not.toContain('画面描述')
    expect(validateMultiParamShotParameters(legacyLikeShot as StoryboardShot).ok).toBe(true)
  })

  it('reports missing prompt text when neither prompt nor description exists', () => {
    const shot = {
      id: 'shot-2',
      index: 2,
      title: 'shot 2',
      prompt: '   ',
      characters: [{ id: 'ch-1', name: 'character A', type: 'character' }],
      scenes: [{ id: 'sc-1', name: 'scene A', type: 'scene' }],
      props: [],
      style: 'style',
      ratio: '16:9',
      status: 'pending-review',
      storyboardReviewed: true,
      referenceImages: [],
      createdAt: '2026-03-12 17:16',
    } as StoryboardShot

    expect(resolveMissingMultiParamFields(shot)).toContain('画面描述')
    expect(validateMultiParamShotParameters(shot).ok).toBe(false)
  })
})