import type { VoiceOption as SettingVoiceOption } from '@/types/settingAsset'
import type { VoiceAsset } from '@/types/voice'

export interface VoiceOption {
  id: string
  name: string
  label: string
  value: string
}

export const mapVoiceAssetsToOptions = (voices: VoiceAsset[]): VoiceOption[] =>
  voices.map((voice) => ({
    id: voice.id,
    name: voice.name,
    label: voice.name,
    value: voice.id,
  }))

export const resolveVoiceOption = (
  options: VoiceOption[],
  voiceId?: string,
): VoiceOption | null => options.find((item) => item.id === voiceId || item.value === voiceId) ?? null

export const mapVoiceAssetsToSettingVoiceOptions = (voices: VoiceAsset[]): SettingVoiceOption[] =>
  voices.map((voice) => ({
    id: voice.id,
    name: voice.name,
    duration: voice.duration > 0 ? `00:${String(voice.duration).padStart(2, '0')}` : undefined,
    audioUrl: voice.audioUrl,
  }))
