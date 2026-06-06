export interface DubbingPlaybackTransitionInput {
  activeLineId: string | null
  nextLineId: string
}

export interface DubbingPlaybackTransitionResult {
  mode: 'play' | 'stop'
  nextActiveLineId: string | null
}

export const resolveDubbingPlaybackTransition = (
  input: DubbingPlaybackTransitionInput,
): DubbingPlaybackTransitionResult => {
  if (input.activeLineId === input.nextLineId) {
    return {
      mode: 'stop',
      nextActiveLineId: null,
    }
  }

  return {
    mode: 'play',
    nextActiveLineId: input.nextLineId,
  }
}
