import { buildDubbingExportFileName } from '@/features/editor/editorArtifactMapper'
import type { DubbingRoleCardModel } from '@/types/dubbing'
import { resolveVisibleDubbingCards } from './dubbingCardVisibilityState'

export interface DubbingCompleteValidationResult {
  ok: boolean
  message: string
}

export { buildDubbingExportFileName }

export const validateDubbingBeforeComplete = (cards: DubbingRoleCardModel[]): DubbingCompleteValidationResult => {
  const visibleCards = resolveVisibleDubbingCards(cards)
  const visibleLines = visibleCards.flatMap((card) => card.lines)

  if (visibleLines.length === 0) {
    return {
      ok: false,
      message: '当前没有可生成配音的台词，请先检查视频对白内容',
    }
  }

  const missingCount = visibleLines.filter((line) => !line.audioUrl).length
  if (missingCount > 0) {
    return {
      ok: false,
      message: `仍有 ${missingCount} 条可见台词未生成配音，请全部生成后再进入完成页`,
    }
  }

  return {
    ok: true,
    message: '',
  }
}
