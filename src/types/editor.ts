import type { GenerationStatus } from './project'
import type { DubbingDraft } from './dubbing'
import type { SettingAsset } from './settingAsset'
import type { StoryboardRatio, StoryboardReferenceImage, StoryboardVoiceAssignment } from './storyboard'

export interface ScriptDraft {
  content: string
  prompt: string
  generated: string
  updatedAt: string
}

export interface CharacterSetting {
  id: string
  name: string
  description: string
}

export interface SceneSetting {
  id: string
  name: string
  description: string
}

export interface PropSetting {
  id: string
  name: string
  description: string
}

export interface Shot {
  id: string
  index: number
  title: string
  description: string
  characterIds: string[]
  sceneIds: string[]
  propIds: string[]
  imageUrl?: string
  videoUrl?: string
  videoPrompt?: string
  dialogue?: string
  durationSeconds?: number
  voiceAssignments?: StoryboardVoiceAssignment[]
  status: GenerationStatus
  style?: string
  ratio?: StoryboardRatio
  isLocked?: boolean
  isFavorite?: boolean
  referenceImages?: StoryboardReferenceImage[]
  createdAt?: string
}

export interface EditorDraft {
  projectId: string
  script: ScriptDraft
  characters: CharacterSetting[]
  scenes: SceneSetting[]
  props: PropSetting[]
  settingAssets: SettingAsset[]
  shots: Shot[]
  dubbing: DubbingDraft
}
