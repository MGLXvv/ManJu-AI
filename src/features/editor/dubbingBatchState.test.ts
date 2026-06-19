import { describe, expect, it } from 'vitest'
import type { DubbingRoleCardModel, DubbingRoleLineDraft } from '@/types/dubbing'
import {
  canBatchGenerateDubbingCard,
  isDubbingCardCompleted,
  isDubbingCardGenerating,
  isDubbingLineCompleted,
  isDubbingLineGenerating,
  resolveDubbingBatchGenerateTargets,
} from './dubbingBatchState'

const makeLine = (overrides: Partial<DubbingRoleLineDraft> = {}): DubbingRoleLineDraft => ({
  id: overrides.id ?? 'line-1',
  shotId: overrides.shotId ?? 'shot-1',
  shotLabel: overrides.shotLabel ?? '镜头 1',
  text: overrides.text ?? '第一句对白',
  audioUrl: overrides.audioUrl,
  status: overrides.status ?? 'idle',
})

const makeCard = (overrides: Partial<DubbingRoleCardModel> = {}): DubbingRoleCardModel => ({
  id: overrides.id ?? 'card-1',
  title: overrides.title ?? '角色A',
  imageUrl: overrides.imageUrl ?? 'data:image/png;base64,mock',
  selectedVoiceId: overrides.selectedVoiceId ?? 'voice-1',
  voiceOptions: overrides.voiceOptions ?? [{ id: 'voice-1', name: '温柔女声' }],
  createdAt: overrides.createdAt ?? '2026-03-12 17:16',
  hidden: overrides.hidden ?? false,
  lines: overrides.lines ?? [makeLine()],
})

describe('dubbingBatchState', () => {
  it('detects generating and completed line states', () => {
    expect(isDubbingLineGenerating(makeLine({ status: 'pending' }))).toBe(true)
    expect(isDubbingLineGenerating(makeLine({ status: 'generating' }))).toBe(true)
    expect(isDubbingLineGenerating(makeLine({ status: 'failed' }))).toBe(false)

    expect(isDubbingLineCompleted(makeLine({ status: 'success', audioUrl: 'data:audio/wav;base64,mock' }))).toBe(true)
    expect(isDubbingLineCompleted(makeLine({ status: 'success' }))).toBe(false)
  })

  it('detects completed and generating card states', () => {
    expect(
      isDubbingCardCompleted(
        makeCard({
          lines: [makeLine({ status: 'success', audioUrl: 'data:audio/wav;base64,mock' })],
        }),
      ),
    ).toBe(true)
    expect(isDubbingCardCompleted(makeCard({ lines: [makeLine({ status: 'success' })] }))).toBe(false)

    expect(isDubbingCardGenerating(makeCard({ lines: [makeLine({ status: 'pending' })] }))).toBe(true)
    expect(isDubbingCardGenerating(makeCard({ lines: [makeLine({ status: 'generating' })] }))).toBe(true)
    expect(isDubbingCardGenerating(makeCard({ lines: [makeLine({ status: 'failed' })] }))).toBe(false)
  })

  it('allows only eligible cards into batch generation', () => {
    expect(canBatchGenerateDubbingCard(makeCard())).toBe(true)
    expect(canBatchGenerateDubbingCard(makeCard({ hidden: true }))).toBe(false)
    expect(canBatchGenerateDubbingCard(makeCard({ lines: [] }))).toBe(false)
    expect(canBatchGenerateDubbingCard(makeCard({ lines: [makeLine({ status: 'pending' })] }))).toBe(false)
    expect(canBatchGenerateDubbingCard(makeCard({ lines: [makeLine({ status: 'generating' })] }))).toBe(false)
    expect(
      canBatchGenerateDubbingCard(
        makeCard({
          lines: [makeLine({ status: 'success', audioUrl: 'data:audio/wav;base64,mock' })],
        }),
      ),
    ).toBe(false)
    expect(canBatchGenerateDubbingCard(makeCard({ lines: [makeLine({ status: 'failed' })] }))).toBe(true)
    expect(canBatchGenerateDubbingCard(makeCard({ lines: [makeLine({ status: 'success' })] }))).toBe(true)
  })

  it('returns only eligible cards as batch targets', () => {
    const cards = [
      makeCard({ id: 'card-1' }),
      makeCard({ id: 'card-2', hidden: true }),
      makeCard({ id: 'card-3', lines: [] }),
      makeCard({ id: 'card-4', lines: [makeLine({ status: 'pending' })] }),
      makeCard({ id: 'card-5', lines: [makeLine({ status: 'success', audioUrl: 'data:audio/wav;base64,mock' })] }),
      makeCard({ id: 'card-6', lines: [makeLine({ status: 'failed' })] }),
      makeCard({ id: 'card-7', lines: [makeLine({ status: 'success' })] }),
    ]

    expect(resolveDubbingBatchGenerateTargets(cards).map((card) => card.id)).toEqual(['card-1', 'card-6', 'card-7'])
  })
})
