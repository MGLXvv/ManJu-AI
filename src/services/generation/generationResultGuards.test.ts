import { describe, expect, it } from 'vitest'
import { API_ERROR_CODES } from '@/types/api-enums'
import type { SettingAsset } from '@/types/settingAsset'
import type { StoryboardShot } from '@/types/storyboard'
import type {
  ScriptGenerateResult,
  SettingAssetImageResult,
  StoryboardImageResult,
  StoryboardPromptOptimizeResult,
  StoryboardUpscaleResult,
} from './generationResult.types'
import {
  assertScriptGenerateResult,
  assertScriptOptimizeResult,
  assertSettingAssetResult,
  assertStoryboardImageResult,
  assertStoryboardPromptResult,
  assertStoryboardUpscaleResult,
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
    expect(() => assertScriptGenerateResult({})).toThrow('SCRIPT_GENERATE_FAILED')
    expect(() => assertScriptOptimizeResult(undefined)).toThrow('SCRIPT_OPTIMIZE_FAILED')
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

  it('throws storyboard image and upscale errors for incomplete results', () => {
    expect(() => assertStoryboardImageResult({ imageUrl: 'x' })).toThrow(API_ERROR_CODES.storyboardGenerateFailed)
    expect(() => assertStoryboardUpscaleResult({ shot: makeGuardShot(), imageUrl: '' })).toThrow(
      API_ERROR_CODES.storyboardUpscaleFailed,
    )
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
  })
})
