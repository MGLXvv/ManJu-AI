import { describe, expect, it } from 'vitest'
import {
  buildStoryboardEditedImage,
  buildStoryboardImageEditRecord,
  buildStoryboardSaveState,
  buildStoryboardUpscaledImage,
  canOpenStoryboardImageTools,
  clampStoryboardSelection,
} from '@/features/editor/storyboardPreviewState'

describe('storyboardPreviewState', () => {
  it('builds save state copy from submitting and dirty state', () => {
    expect(buildStoryboardSaveState({ submitting: true, isDirty: true })).toEqual({
      label: '保存中',
      tone: 'saving',
    })

    expect(buildStoryboardSaveState({ submitting: false, isDirty: true })).toEqual({
      label: '未保存',
      tone: 'dirty',
    })

    expect(buildStoryboardSaveState({ submitting: false, isDirty: false })).toEqual({
      label: '已保存',
      tone: 'saved',
    })
  })

  it('clamps selection to stage bounds and preserves positive size', () => {
    expect(
      clampStoryboardSelection({
        x: -10,
        y: 20,
        width: 200,
        height: 90,
      }),
    ).toEqual({
      x: 0,
      y: 20,
      width: 100,
      height: 80,
    })
  })

  it('clamps reverse drag selections into a positive rect', () => {
    expect(
      clampStoryboardSelection({
        x: 82,
        y: 64,
        width: -40,
        height: -12,
      }),
    ).toEqual({
      x: 42,
      y: 52,
      width: 40,
      height: 12,
    })
  })

  it('builds edited storyboard image data url', () => {
    const result = buildStoryboardEditedImage({
      sourceUrl: 'https://example.com/image.png',
      prompt: '把主体表情改得更坚定，补一点逆光',
      title: '镜头 1',
      selection: { x: 12, y: 18, width: 46, height: 35 },
    })

    expect(result.imageUrl.startsWith('data:image/svg+xml;charset=UTF-8,')).toBe(true)
    expect(result.referenceLabel).toBe('编辑结果')
  })

  it('normalizes and truncates edit prompt text in generated image', () => {
    const result = buildStoryboardEditedImage({
      sourceUrl: 'https://example.com/image.png',
      prompt: '  first line   second line   third line   fourth line   fifth line  ',
      title: '镜头 2',
      selection: { x: 10, y: 12, width: 30, height: 26 },
    })

    const svg = decodeURIComponent(result.imageUrl.split(',', 2)[1] ?? '')
    expect(svg).toContain('first line second line third')
    expect(svg).toContain('...')
    expect(svg).toContain('first line second line third...')
  })

  it('builds an edit history record with trimmed prompt and clamped selection', () => {
    const result = buildStoryboardImageEditRecord({
      id: 'edit-1',
      now: '2026-06-19T10:00:00.000Z',
      prompt: '  强化主角表情   并补一点逆光  ',
      selection: { x: 88, y: -6, width: 24, height: 120 },
      sourceImageUrl: 'before',
      resultImageUrl: 'after',
    })

    expect(result).toEqual({
      id: 'edit-1',
      prompt: '强化主角表情 并补一点逆光',
      selection: {
        x: 88,
        y: 0,
        width: 12,
        height: 100,
      },
      sourceImageUrl: 'before',
      resultImageUrl: 'after',
      createdAt: '2026-06-19T10:00:00.000Z',
    })
  })

  it('builds upscaled storyboard image data url', () => {
    const result = buildStoryboardUpscaledImage({
      sourceUrl: 'https://example.com/image.png',
      title: '镜头 1',
    })

    expect(result.imageUrl.startsWith('data:image/svg+xml;charset=UTF-8,')).toBe(true)
    expect(result.referenceLabel).toBe('高清放大')
  })

  it('only enables image tools when shot image exists', () => {
    expect(canOpenStoryboardImageTools('')).toBe(false)
    expect(canOpenStoryboardImageTools(undefined)).toBe(false)
    expect(canOpenStoryboardImageTools('data:image/png;base64,abc')).toBe(true)
  })
})
