import type { EditorDraft } from '@/types/editor'
import { resolveVisibleDubbingCards } from './dubbingCardVisibilityState'

export interface CompleteSummary {
  shotCount: number
  playableVideoCount: number
  generatedAudioCount: number
  hasPlayableVideo: boolean
  hasGeneratedAudio: boolean
  videoEmptyText: string
  audioEmptyText: string
  exportNoticeText: string
}

const COMPLETE_PAGE_VIDEO_EMPTY_TEXT = '暂无可预览视频片段，请先在视频生成页完成至少一个镜头视频。'
const COMPLETE_PAGE_AUDIO_EMPTY_TEXT = '暂无已生成配音结果，请先在配音页完成至少一条配音。'
const COMPLETE_PAGE_EXPORT_NOTICE_TEXT =
  '当前页面仅汇总项目草稿、视频片段和配音结果；剪映工程导出需等待后续 UI 与导出规则确认。'

export const buildCompleteSummary = (draft: EditorDraft | null | undefined): CompleteSummary => {
  if (!draft) {
    return {
      shotCount: 0,
      playableVideoCount: 0,
      generatedAudioCount: 0,
      hasPlayableVideo: false,
      hasGeneratedAudio: false,
      videoEmptyText: COMPLETE_PAGE_VIDEO_EMPTY_TEXT,
      audioEmptyText: COMPLETE_PAGE_AUDIO_EMPTY_TEXT,
      exportNoticeText: COMPLETE_PAGE_EXPORT_NOTICE_TEXT,
    }
  }

  const visibleShots = draft.shots.filter((shot) => !shot.isHidden)
  const visibleCards = resolveVisibleDubbingCards(draft.dubbing.cards)
  const playableVideoCount = visibleShots.filter((shot) => Boolean(shot.videoUrl)).length
  const generatedAudioCount = visibleCards.reduce(
    (count, card) => count + card.lines.filter((line) => Boolean(line.audioUrl)).length,
    0,
  )

  return {
    shotCount: visibleShots.length,
    playableVideoCount,
    generatedAudioCount,
    hasPlayableVideo: playableVideoCount > 0,
    hasGeneratedAudio: generatedAudioCount > 0,
    videoEmptyText: COMPLETE_PAGE_VIDEO_EMPTY_TEXT,
    audioEmptyText: COMPLETE_PAGE_AUDIO_EMPTY_TEXT,
    exportNoticeText: COMPLETE_PAGE_EXPORT_NOTICE_TEXT,
  }
}
