import { describe, expect, it } from 'vitest'
import { API_ERROR_CODES } from '@/types/api-enums'
import type { SettingAsset } from '@/types/settingAsset'
import type { StoryboardShot } from '@/types/storyboard'
import type {
  DubbingGenerateTaskResult,
  ScriptGenerateResult,
  SettingAssetImageTaskResult,
  StoryboardImageTaskResult,
  StoryboardPromptOptimizeResult,
  VideoGenerateTaskResult,
  VideoOptimizeResult,
} from '@/services/generation/generationResult.types'
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
} from '@/services/generation/generationResultGuards'

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
    storyboardReviewed: false,
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
    description: '',
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

  it('accepts transitional full storyboard results', () => {
    const shot = makeGuardShot()
    const result = assertStoryboardImageResult({
      shotId: 'shot-1',
      imageUrl: '/media/shot-1.png',
      shot,
    })

    expect(result).toEqual<StoryboardImageTaskResult>({
      shotId: 'shot-1',
      imageUrl: '/media/shot-1.png',
      shot,
    })
  })

  it('accepts lightweight storyboard results without a full shot', () => {
    expect(assertStoryboardImageResult({ shotId: 'shot-1', imageUrl: '/media/shot-1.png' })).toEqual({
      shotId: 'shot-1',
      imageUrl: '/media/shot-1.png',
      shot: undefined,
    })
  })

  it('throws storyboard image errors for missing image or target id', () => {
    expect(() => assertStoryboardImageResult({ imageUrl: 'x' })).toThrow(API_ERROR_CODES.storyboardGenerateFailed)
    expect(() => assertStoryboardImageResult({ shot: makeGuardShot() })).toThrow(API_ERROR_CODES.storyboardGenerateFailed)
  })

  it('returns storyboard prompt result when prompt exists', () => {
    const result = assertStoryboardPromptResult({ prompt: '镜头推进，强化光影层次' })
    expect(result).toEqual<StoryboardPromptOptimizeResult>({ prompt: '镜头推进，强化光影层次' })
  })

  it('throws storyboard optimize failed for missing prompt results', () => {
    expect(() => assertStoryboardPromptResult({})).toThrow(API_ERROR_CODES.storyboardOptimizeFailed)
  })

  it('accepts lightweight upscale results and rejects incomplete results', () => {
    expect(assertStoryboardUpscaleResult({ shotId: 'shot-1', imageUrl: '/media/upscaled.png' })).toMatchObject({
      shotId: 'shot-1',
      imageUrl: '/media/upscaled.png',
    })
    expect(() => assertStoryboardUpscaleResult({ imageUrl: 'x' })).toThrow(API_ERROR_CODES.storyboardUpscaleFailed)
    expect(() => assertStoryboardUpscaleResult({ shot: makeGuardShot(), imageUrl: '' })).toThrow(
      API_ERROR_CODES.storyboardUpscaleFailed,
    )
  })

  it('accepts transitional and lightweight setting asset results', () => {
    const asset = makeGuardAsset()
    expect(
      assertSettingAssetResult({ assetId: 'asset-1', imageUrl: '/media/asset.png', asset }),
    ).toEqual<SettingAssetImageTaskResult>({
      assetId: 'asset-1',
      imageUrl: '/media/asset.png',
      asset,
    })
    expect(assertSettingAssetResult({ assetId: 'asset-1', imageUrl: '/media/asset.png' })).toEqual({
      assetId: 'asset-1',
      imageUrl: '/media/asset.png',
      asset: undefined,
    })
  })

  it('throws setting image generate failed for incomplete asset results', () => {
    expect(() => assertSettingAssetResult({ imageUrl: 'x' })).toThrow(API_ERROR_CODES.settingImageGenerateFailed)
    expect(() => assertSettingAssetResult({ asset: makeGuardAsset() })).toThrow(API_ERROR_CODES.settingImageGenerateFailed)
  })

  it('accepts transitional and lightweight video results', () => {
    const shot = makeGuardShot({ videoUrl: '/media/shot-1.mp4' })
    expect(
      assertVideoGenerateResult({ shotId: 'shot-1', videoUrl: '/media/shot-1.mp4', shot }),
    ).toEqual<VideoGenerateTaskResult>({
      shotId: 'shot-1',
      videoUrl: '/media/shot-1.mp4',
      shot,
    })
    expect(assertVideoGenerateResult({ shotId: 'shot-1', videoUrl: '/media/shot-1.mp4' })).toEqual({
      shotId: 'shot-1',
      videoUrl: '/media/shot-1.mp4',
      shot: undefined,
    })
  })

  it('throws video generate failed for incomplete video results', () => {
    expect(() => assertVideoGenerateResult({ shot: makeGuardShot() })).toThrow(API_ERROR_CODES.videoGenerateFailed)
    expect(() => assertVideoGenerateResult({ videoUrl: '/media/shot-1.mp4' })).toThrow(API_ERROR_CODES.videoGenerateFailed)
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

  it('accepts full dubbing lines and lightweight line ids', () => {
    const full = assertDubbingGenerateResult({
      cardId: 'card-1',
      lines: [
        {
          id: 'line-1',
          shotId: 'shot-1',
          shotLabel: '镜头 1',
          text: '第一句对白',
          audioUrl: '/media/line-1.mp3',
          status: 'success',
        },
      ],
    })
    expect(full.lineIds).toEqual(['line-1'])

    expect(
      assertDubbingGenerateResult({
        cardId: 'card-1',
        lineIds: ['line-1'],
        audioByLineId: { 'line-1': '/media/line-1.mp3' },
      }),
    ).toEqual<DubbingGenerateTaskResult>({
      cardId: 'card-1',
      lineIds: ['line-1'],
      lines: undefined,
      audioByLineId: { 'line-1': '/media/line-1.mp3' },
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
