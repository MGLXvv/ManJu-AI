import type { DubbingDraft } from './dubbing'
import type { SettingAsset } from './settingAsset'
import type {
  StoryboardImageEditRecord,
  StoryboardRatio,
  StoryboardReferenceImage,
  StoryboardShotStatus,
  StoryboardVoiceAssignment,
} from './storyboard'

export interface ScriptDraft {
  content: string
  prompt: string
  outline: string
  generated: string
  storyboard: string
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
  status: StoryboardShotStatus
  style?: string
  ratio?: StoryboardRatio
  isHidden?: boolean
  isLocked?: boolean
  storyboardReviewed?: boolean
  /** @deprecated 旧草稿兼容字段，请使用 storyboardReviewed */
  isFavorite?: boolean
  videoReviewed?: boolean
  referenceImages?: StoryboardReferenceImage[]
  editHistory?: StoryboardImageEditRecord[]
  createdAt?: string
}

export interface EditorDraft {
  projectId: string
  script: ScriptDraft
  characters: CharacterSetting[]
  scenes: SceneSetting[]
  props: PropSetting[]
  settingAssets: SettingAsset[]
  storyboardGenerationMode: 'multi-param' | 'image' | null
  shots: Shot[]
  dubbing: DubbingDraft
}

export interface SaveDraftResult {
  draft: EditorDraft
  savedAt: string
}