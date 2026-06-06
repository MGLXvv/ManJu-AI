import { buildStoryboardDraftShots } from '@/features/editor/storyboardPersistState'
import type { StoryboardShot } from '@/types/storyboard'

export const buildStoryboardDraftSnapshot = (shots: StoryboardShot[]): string => {
  return JSON.stringify(buildStoryboardDraftShots(shots))
}

export const hasUnsavedStoryboardChanges = (lastSavedSnapshot: string, shots: StoryboardShot[]): boolean => {
  return lastSavedSnapshot !== buildStoryboardDraftSnapshot(shots)
}
