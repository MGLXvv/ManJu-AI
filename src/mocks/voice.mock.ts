import type { VoiceAsset } from '@/types/voice'
import { MOCK_MEDIA_AUDIO_DURATION_SECONDS, MOCK_MEDIA_AUDIO_URL } from './mockMedia'

export const mockVoices: VoiceAsset[] = [
  { id: 'voice-1', name: '浑厚男中音', audioUrl: MOCK_MEDIA_AUDIO_URL, duration: MOCK_MEDIA_AUDIO_DURATION_SECONDS, createdAt: '2026-03-12 17:16' },
  { id: 'voice-2', name: '温柔女中音', audioUrl: MOCK_MEDIA_AUDIO_URL, duration: MOCK_MEDIA_AUDIO_DURATION_SECONDS, createdAt: '2026-03-12 17:16' },
  { id: 'voice-3', name: '童音女', audioUrl: MOCK_MEDIA_AUDIO_URL, duration: MOCK_MEDIA_AUDIO_DURATION_SECONDS, createdAt: '2026-03-12 17:16' },
  { id: 'voice-4', name: '童音男', audioUrl: MOCK_MEDIA_AUDIO_URL, duration: MOCK_MEDIA_AUDIO_DURATION_SECONDS, createdAt: '2026-03-12 17:16' },
  { id: 'voice-5', name: '清亮青年音', audioUrl: MOCK_MEDIA_AUDIO_URL, duration: MOCK_MEDIA_AUDIO_DURATION_SECONDS, createdAt: '2026-03-12 17:16' },
  { id: 'voice-6', name: '磁性旁白', audioUrl: MOCK_MEDIA_AUDIO_URL, duration: MOCK_MEDIA_AUDIO_DURATION_SECONDS, createdAt: '2026-03-12 17:16' },
  { id: 'voice-7', name: '活泼少女音', audioUrl: MOCK_MEDIA_AUDIO_URL, duration: MOCK_MEDIA_AUDIO_DURATION_SECONDS, createdAt: '2026-03-12 17:16' },
  { id: 'voice-8', name: '冷静御姐音', audioUrl: MOCK_MEDIA_AUDIO_URL, duration: MOCK_MEDIA_AUDIO_DURATION_SECONDS, createdAt: '2026-03-12 17:16' },
  { id: 'voice-9', name: '少年热血音', audioUrl: MOCK_MEDIA_AUDIO_URL, duration: MOCK_MEDIA_AUDIO_DURATION_SECONDS, createdAt: '2026-03-12 17:16' },
]
