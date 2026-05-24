import type { GenerationStatus } from './project'

export interface ScriptDraft {
  content: string
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
  status: GenerationStatus
}

export interface EditorDraft {
  projectId: string
  script: ScriptDraft
  characters: CharacterSetting[]
  scenes: SceneSetting[]
  shots: Shot[]
}
