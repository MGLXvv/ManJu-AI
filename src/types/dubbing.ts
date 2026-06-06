import type { GenerationStatus } from './project'
import type { VoiceOption } from './settingAsset'

export interface DubbingRoleLineDraft {
  id: string
  shotId: string
  shotLabel: string
  text: string
  audioUrl?: string
  status: GenerationStatus
}

export interface DubbingRoleCardDraft {
  id: string
  selectedVoiceId: string
  hidden: boolean
  lines: DubbingRoleLineDraft[]
}

export interface DubbingDraft {
  modelId: string
  cards: DubbingRoleCardDraft[]
}

export interface DubbingRoleCardModel {
  id: string
  title: string
  imageUrl?: string
  selectedVoiceId: string
  voiceOptions: VoiceOption[]
  createdAt: string
  hidden: boolean
  lines: DubbingRoleLineDraft[]
}
