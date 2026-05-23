import type { GenerationStatus } from './project'

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
