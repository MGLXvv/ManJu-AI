import { describe, expect, it } from 'vitest'
import { buildMockAudioDataUrl } from './dubbingAudioState'

describe('dubbingAudioState', () => {
  it('builds a playable wav data url', () => {
    const url = buildMockAudioDataUrl({ seed: '赵灵儿-镜头1', durationMs: 480 })

    expect(url.startsWith('data:audio/wav;base64,')).toBe(true)
    expect(url.length).toBeGreaterThan(100)
  })

  it('builds stable output for the same seed and duration', () => {
    expect(buildMockAudioDataUrl({ seed: 'same', durationMs: 320 })).toBe(
      buildMockAudioDataUrl({ seed: 'same', durationMs: 320 }),
    )
  })
})
