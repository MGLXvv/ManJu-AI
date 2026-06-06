import { describe, expect, it } from 'vitest'
import { resolveDubbingPlaybackTransition } from './dubbingPlaybackState'

describe('dubbingPlaybackState', () => {
  it('stops playback when the same line is clicked again', () => {
    expect(resolveDubbingPlaybackTransition({ activeLineId: 'line-1', nextLineId: 'line-1' })).toEqual({
      mode: 'stop',
      nextActiveLineId: null,
    })
  })

  it('switches playback when a different line is clicked', () => {
    expect(resolveDubbingPlaybackTransition({ activeLineId: 'line-1', nextLineId: 'line-2' })).toEqual({
      mode: 'play',
      nextActiveLineId: 'line-2',
    })
  })

  it('starts playback when there is no active line', () => {
    expect(resolveDubbingPlaybackTransition({ activeLineId: null, nextLineId: 'line-3' })).toEqual({
      mode: 'play',
      nextActiveLineId: 'line-3',
    })
  })
})
