export interface VoiceAsset {
  id: string
  name: string
  audioUrl: string
  audioMediaId?: string
  duration: number
  createdAt: string
}

export interface CreateVoiceAssetInput {
  name: string
  audioUrl: string
  audioMediaId?: string
  duration: number
}

export interface UpdateVoiceAssetInput extends Partial<CreateVoiceAssetInput> {}

export interface VoiceEditorSavePayload extends CreateVoiceAssetInput {
  audioFile?: File
}
