import type { CreateVoiceAssetInput, UpdateVoiceAssetInput, VoiceAsset } from '@/types/voice'

export type { CreateVoiceAssetInput, UpdateVoiceAssetInput, VoiceAsset } from '@/types/voice'

export interface VoiceApiContract {
  list(): Promise<VoiceAsset[]>
  create(input: CreateVoiceAssetInput): Promise<VoiceAsset>
  update(voiceId: string, input: UpdateVoiceAssetInput): Promise<VoiceAsset | null>
  remove(voiceId: string): Promise<void>
}
