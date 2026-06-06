export type StoryboardTagType = 'character' | 'scene' | 'prop'
export type StoryboardRatio = '16:9' | '9:16'
export type StoryboardShotStatus = 'idle' | 'pending' | 'generating' | 'success' | 'failed'

export interface StoryboardTag {
  id: string
  name: string
  type: StoryboardTagType
}

export interface StoryboardReferenceImage {
  id: string
  url: string
  label?: string
  sourceShotId?: string
}

export interface StoryboardVoiceAssignment {
  characterId: string
  voice: string
}

export interface StoryboardShot {
  id: string
  index: number
  title: string
  imageUrl?: string
  videoUrl?: string
  prompt: string
  videoPrompt?: string
  dialogue?: string
  durationSeconds?: number
  voiceAssignments?: StoryboardVoiceAssignment[]
  characters: StoryboardTag[]
  scenes: StoryboardTag[]
  props: StoryboardTag[]
  style: string
  ratio: StoryboardRatio
  status: StoryboardShotStatus
  isLocked?: boolean
  isFavorite?: boolean
  referenceImages: StoryboardReferenceImage[]
  createdAt: string
}

export interface StoryboardTagOptions {
  characters: StoryboardTag[]
  scenes: StoryboardTag[]
  props: StoryboardTag[]
}
