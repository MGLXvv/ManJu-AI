import { describe, expect, it } from 'vitest'
import {
  buildStoryboardSaveState,
  buildStoryboardEditedImage,
  clampStoryboardSelection,
  canOpenStoryboardImageTools,
} from './storyboardPreviewState'

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

    expect(
      clampStoryboardSelection({
        x: 75,
        y: 75,
        width: -30,
        height: -50,
      }),
    ).toEqual({
      x: 45,
      y: 25,
      width: 30,
      height: 50,
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

  it('only enables image tools when shot image exists', () => {
    expect(canOpenStoryboardImageTools('')).toBe(false)
    expect(canOpenStoryboardImageTools(undefined)).toBe(false)
    expect(canOpenStoryboardImageTools('data:image/png;base64,abc')).toBe(true)
  })
})
