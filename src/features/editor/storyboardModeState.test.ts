import { describe, expect, it } from 'vitest'
import {
  getStoryboardModeEntryState,
  resolveStoryboardToolAvailability,
} from './storyboardModeState'

describe('storyboardModeState', () => {
  it('always allows view across modes', () => {
    expect(
      resolveStoryboardToolAvailability({
        mode: null,
        action: 'view',
        isLocked: true,
      }),
    ).toEqual({
      enabled: true,
      reason: '',
    })

    expect(
      resolveStoryboardToolAvailability({
        mode: 'multi-param',
        action: 'view',
        isLocked: false,
      }),
    ).toEqual({
      enabled: true,
      reason: '',
    })
  })

  it('blocks every non-view action outside image mode', () => {
    expect(
      resolveStoryboardToolAvailability({
        mode: 'multi-param',
        action: 'edit',
        isLocked: false,
      }),
    ).toEqual({
      enabled: false,
      reason: '图片生成模式可用',
    })

    expect(
      resolveStoryboardToolAvailability({
        mode: null,
        action: 'delete',
        isLocked: false,
      }),
    ).toEqual({
      enabled: false,
      reason: '图片生成模式可用',
    })
  })

  it('blocks non-view actions on locked shots in image mode', () => {
    expect(
      resolveStoryboardToolAvailability({
        mode: 'image',
        action: 'copy',
        isLocked: true,
      }),
    ).toEqual({
      enabled: false,
      reason: '当前镜头已锁定',
    })

    expect(
      resolveStoryboardToolAvailability({
        mode: 'image',
        action: 'lock',
        isLocked: true,
      }),
    ).toEqual({
      enabled: true,
      reason: '',
    })
  })

  it('allows supported edit actions on unlocked shots in image mode', () => {
    expect(
      resolveStoryboardToolAvailability({
        mode: 'image',
        action: 'edit',
        isLocked: false,
      }),
    ).toEqual({
      enabled: true,
      reason: '',
    })

    expect(
      resolveStoryboardToolAvailability({
        mode: 'image',
        action: 'toggle-hidden',
        isLocked: false,
      }),
    ).toEqual({
      enabled: true,
      reason: '',
    })

    expect(
      resolveStoryboardToolAvailability({
        mode: 'image',
        action: 'zoom',
        isLocked: false,
      }),
    ).toEqual({
      enabled: true,
      reason: '',
    })
  })

  it('treats an existing storyboard mode as locked for re-entry', () => {
    expect(getStoryboardModeEntryState(null)).toEqual({
      locked: false,
      mode: 'multi-param',
    })

    expect(getStoryboardModeEntryState('image')).toEqual({
      locked: true,
      mode: 'image',
    })

    expect(getStoryboardModeEntryState('multi-param')).toEqual({
      locked: true,
      mode: 'multi-param',
    })
  })
})
