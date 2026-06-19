import type { DubbingRoleCardModel } from '@/types/dubbing'

export interface HiddenDubbingCardLike {
  hidden: boolean
}

export const isVisibleDubbingCard = <T extends HiddenDubbingCardLike>(card: T): boolean => card.hidden !== true

export const resolveVisibleDubbingCards = <T extends HiddenDubbingCardLike>(cards: T[]): T[] =>
  cards.filter(isVisibleDubbingCard)

export const hideDubbingCardById = (cards: DubbingRoleCardModel[], cardId: string): DubbingRoleCardModel[] =>
  cards.map((card) => (card.id === cardId ? { ...card, hidden: true } : card))
