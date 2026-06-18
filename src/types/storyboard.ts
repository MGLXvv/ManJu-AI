export type StoryboardTagType = 'character' | 'scene' | 'prop'
export type StoryboardRatio = '16:9' | '9:16'
export type StoryboardShotStatus = 'pending-review' | 'generating' | 'success' | 'failed'

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
  id: string
  characterId: string
  voiceId?: string
  voiceName?: string
  voice: string
}

export interface StoryboardAttachment {
  id: string
  name: string
  size: number
  type: string
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
  attachments?: StoryboardAttachment[]
  characters: StoryboardTag[]
  scenes: StoryboardTag[]
  props: StoryboardTag[]
  style: string
  ratio: StoryboardRatio
  status: StoryboardShotStatus
  isHidden?: boolean
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

export interface StoryboardInsertDraft {
  characterIds: string[]
  sceneIds: string[]
  propIds: string[]
  prompt: string
  style: string
  ratio: StoryboardRatio
}
