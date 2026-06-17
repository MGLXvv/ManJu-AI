import type { StoryboardReferenceImage, StoryboardShot, StoryboardTagOptions } from '@/types/storyboard'

export type { StoryboardReferenceImage, StoryboardShot, StoryboardTagOptions } from '@/types/storyboard'

export interface StoryboardDefaultsResponse {
  shots: StoryboardShot[]
  tagOptions: StoryboardTagOptions
  styleOptions: string[]
}

export interface StoryboardApiContract {
  listDefaults(): Promise<StoryboardDefaultsResponse>
  applyReferenceImage(shot: StoryboardShot, referenceImageId: string): Promise<StoryboardShot | null>
  uploadShotImage(shot: StoryboardShot, imageUrl: string): Promise<StoryboardShot>
  uploadShotVideo(shot: StoryboardShot, videoUrl: string): Promise<StoryboardShot>
  applyEditedImage(shot: StoryboardShot, imageUrl: string): Promise<StoryboardShot>
  generateShotImage(shot: StoryboardShot): Promise<{ imageUrl: string; shot: StoryboardShot }>
  generateVideo(shot: StoryboardShot): Promise<{ videoUrl: string; shot: StoryboardShot }>
  upscaleShotImage(shot: StoryboardShot): Promise<{ imageUrl: string; shot: StoryboardShot }>
}
