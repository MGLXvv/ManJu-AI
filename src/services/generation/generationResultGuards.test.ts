import { describe, expect, it } from 'vitest'
import { API_ERROR_CODES } from '@/types/api-enums'
import type { SettingAsset } from '@/types/settingAsset'
import type { StoryboardShot } from '@/types/storyboard'
import type {
  DubbingGenerateResult,
  ScriptGenerateResult,
  SettingAssetImageResult,
  StoryboardImageResult,
  StoryboardPromptOptimizeResult,
  StoryboardUpscaleResult,
  VideoGenerateResult,
  VideoOptimizeResult,
} from './generationResult.types'
import {
  assertDubbingGenerateResult,
  assertScriptGenerateResult,
  assertScriptOptimizeResult,
  assertSettingAssetResult,
  assertStoryboardImageResult,
  assertStoryboardPromptResult,
  assertStoryboardUpscaleResult,
  assertVideoGenerateResult,
  assertVideoOptimizeResult,
} from './generationResultGuards'

const makeGuardShot = (overrides: Partial<StoryboardShot> = {}): StoryboardShot =>
  ({
    id: 'shot-1',
    index: 1,
    title: '镜头 1',
    prompt: '夜色街道镜头',
    imageUrl: '',
    videoUrl: '',
    videoPrompt: '',
    dialogue: '',
    durationSeconds: 10,
    voiceAssignments: [],
    attachments: [],
    characters: [],
    scenes: [],
    props: [],
    style: '国风漫画',
    ratio: '16:9',
    status: 'success',
    isHidden: false,
    isFavorite: false,
    isLocked: false,
    createdAt: '2026-03-12 17:16',
    referenceImages: [],
    ...overrides,
  }) as StoryboardShot

const makeGuardAsset = (overrides: Partial<SettingAsset> = {}): SettingAsset =>
  ({
    id: 'asset-1',
    type: 'character',
    title: '角色-男主',
    roleName: '角色音色',
    prompt: '夜色街道里的角色设定图',
    imageUrls: [],
    candidateImages: [],
    selectedVoiceId: 'male-mid-deep',
    voiceOptions: [],
    status: 'ready',
    favorite: false,
    createdAt: '2026-03-12 17:16',
    ...overrides,
  }) as SettingAsset

describe('generationResultGuards', () => {
  it('returns script results when script content exists', () => {
    const result = assertScriptGenerateResult({ script: '第一幕：角色出场' })

    expect(result).toEqual<ScriptGenerateResult>({ script: '第一幕：角色出场' })
  })

  it('throws stable script generation and optimization errors for missing script results', () => {
    expect(() => assertScriptGenerateResult({})).toThrow(API_ERROR_CODES.scriptGenerateFailed)
    expect(() => assertScriptOptimizeResult(undefined)).toThrow(API_ERROR_CODES.scriptOptimizeFailed)
  })

  it('returns storyboard image result when image and shot exist', () => {
    const shot = makeGuardShot()

    const result = assertStoryboardImageResult({
      shotId: 'shot-1',
      imageUrl: 'data:image/svg+xml;base64,mock',
      shot,
    })

    expect(result).toEqual<StoryboardImageResult>({
      shotId: 'shot-1',
      imageUrl: 'data:image/svg+xml;base64,mock',
      shot,
    })
  })

  it('throws storyboard image errors for missing image or shot', () => {
    expect(() => assertStoryboardImageResult({ imageUrl: 'x' })).toThrow(API_ERROR_CODES.storyboardGenerateFailed)
    expect(() => assertStoryboardImageResult({ shot: makeGuardShot() })).toThrow(API_ERROR_CODES.storyboardGenerateFailed)
  })

  it('returns storyboard prompt result when prompt exists', () => {
    const result = assertStoryboardPromptResult({ prompt: '镜头推进，强化光影层次' })

    expect(result).toEqual<StoryboardPromptOptimizeResult>({
      prompt: '镜头推进，强化光影层次',
    })
  })

  it('throws storyboard optimize failed for missing prompt results', () => {
    expect(() => assertStoryboardPromptResult({})).toThrow(API_ERROR_CODES.storyboardOptimizeFailed)
  })

  it('throws storyboard upscale errors for missing image or shot', () => {
    expect(() => assertStoryboardUpscaleResult({ imageUrl: 'x' })).toThrow(API_ERROR_CODES.storyboardUpscaleFailed)
    expect(() => assertStoryboardUpscaleResult({ shot: makeGuardShot(), imageUrl: '' })).toThrow(
      API_ERROR_CODES.storyboardUpscaleFailed,
    )
  })

  it('returns setting asset result when image and asset exist', () => {
    const asset = makeGuardAsset()

    const result = assertSettingAssetResult({
      assetId: 'asset-1',
      imageUrl: 'data:image/svg+xml;base64,mock',
      asset,
    })

    expect(result).toEqual<SettingAssetImageResult>({
      assetId: 'asset-1',
      imageUrl: 'data:image/svg+xml;base64,mock',
      asset,
    })
  })

  it('throws setting image generate failed for incomplete asset results', () => {
    expect(() => assertSettingAssetResult({ imageUrl: 'x' })).toThrow(API_ERROR_CODES.settingImageGenerateFailed)
    expect(() => assertSettingAssetResult({ asset: makeGuardAsset() })).toThrow(API_ERROR_CODES.settingImageGenerateFailed)
  })

  it('returns video result when video url and shot exist', () => {
    const shot = makeGuardShot({ videoUrl: 'mock-video://shot-1' })

    const result = assertVideoGenerateResult({
      shotId: 'shot-1',
      videoUrl: 'mock-video://shot-1',
      shot,
    })

    expect(result).toEqual<VideoGenerateResult>({
      shotId: 'shot-1',
      videoUrl: 'mock-video://shot-1',
      shot,
    })
  })

  it('throws video generate failed for incomplete video results', () => {
    expect(() => assertVideoGenerateResult({ shot: makeGuardShot() })).toThrow(API_ERROR_CODES.videoGenerateFailed)
    expect(() => assertVideoGenerateResult({ videoUrl: 'mock-video://shot-1' })).toThrow(API_ERROR_CODES.videoGenerateFailed)
  })

  it('returns video optimize result when value exists', () => {
    const result = assertVideoOptimizeResult({ value: 'optimized text' })

    expect(result).toEqual<VideoOptimizeResult>({ value: 'optimized text' })
  })

  it('throws video optimize failed for missing or non-string optimize values', () => {
    expect(() => assertVideoOptimizeResult(undefined)).toThrow(API_ERROR_CODES.videoOptimizeFailed)
    expect(() => assertVideoOptimizeResult({})).toThrow(API_ERROR_CODES.videoOptimizeFailed)
    expect(() => assertVideoOptimizeResult({ value: 42 as unknown as string })).toThrow(API_ERROR_CODES.videoOptimizeFailed)
  })

  it('returns dubbing result when card id and lines exist', () => {
    const result = assertDubbingGenerateResult({
      cardId: 'card-1',
      lines: [
        {
          id: 'line-1',
          shotId: 'shot-1',
          shotLabel: '镜头 1',
          text: '第一句对白',
          audioUrl: 'data:audio/wav;base64,mock',
          status: 'success',
        },
      ],
    })

    expect(result).toEqual<DubbingGenerateResult>({
      cardId: 'card-1',
      lines: [
        {
          id: 'line-1',
          shotId: 'shot-1',
          shotLabel: '镜头 1',
          text: '第一句对白',
          audioUrl: 'data:audio/wav;base64,mock',
          status: 'success',
        },
      ],
      lineIds: ['line-1'],
    })
  })

  it('throws dubbing generate failed for incomplete dubbing results', () => {
    expect(() => assertDubbingGenerateResult({ lines: [] })).toThrow(API_ERROR_CODES.dubbingGenerateFailed)
    expect(() => assertDubbingGenerateResult({ cardId: 'card-1' })).toThrow(API_ERROR_CODES.dubbingGenerateFailed)
    expect(() => assertDubbingGenerateResult({ cardId: 'card-1', lines: 'bad' as unknown as [] })).toThrow(
      API_ERROR_CODES.dubbingGenerateFailed,
    )
  })
})
