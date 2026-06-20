import { describe, expect, it } from 'vitest'
import type { DubbingRoleCardModel } from '@/types/dubbing'
import { hideDubbingCardById, isVisibleDubbingCard, resolveVisibleDubbingCards } from '@/features/editor/dubbingCardVisibilityState'

const makeCard = (overrides: Partial<DubbingRoleCardModel> = {}): DubbingRoleCardModel => ({
  id: overrides.id ?? 'card-1',
  title: overrides.title ?? '角色A',
  imageUrl: overrides.imageUrl ?? 'data:image/png;base64,mock',
  selectedVoiceId: overrides.selectedVoiceId ?? 'voice-1',
  voiceOptions: overrides.voiceOptions ?? [{ id: 'voice-1', name: '温柔女声' }],
  createdAt: overrides.createdAt ?? '2026-03-12 17:16',
  hidden: overrides.hidden ?? false,
  lines: overrides.lines ?? [],
})

describe('dubbingCardVisibilityState', () => {
  it('treats hidden cards as invisible', () => {
    expect(isVisibleDubbingCard(makeCard())).toBe(true)
    expect(isVisibleDubbingCard(makeCard({ hidden: true }))).toBe(false)
  })

  it('filters hidden cards from visible card lists', () => {
    expect(resolveVisibleDubbingCards([makeCard({ id: 'card-1' }), makeCard({ id: 'card-2', hidden: true })]).map((card) => card.id)).toEqual([
      'card-1',
    ])
  })

  it('soft deletes only the target card by setting hidden to true', () => {
    const cards = [makeCard({ id: 'card-1' }), makeCard({ id: 'card-2' })]

    const nextCards = hideDubbingCardById(cards, 'card-2')

    expect(nextCards).toHaveLength(2)
    expect(nextCards[0]).toMatchObject({ id: 'card-1', hidden: false })
    expect(nextCards[1]).toMatchObject({ id: 'card-2', hidden: true })
  })
})
