import { describe, expect, it } from 'vitest'
import type { DubbingRoleCardModel, DubbingRoleLineDraft } from '@/types/dubbing'
import {
  buildDubbingCardGenerateDisabledReason,
  canBatchGenerateDubbingCard,
  isDubbingCardCompleted,
  isDubbingCardGenerating,
  isDubbingLineCompleted,
  isDubbingLineGenerating,
  resolveDubbingBatchAvailability,
  resolveDubbingBatchGenerateTargets,
} from './dubbingBatchState'

const buildLine = (patch: Partial<DubbingRoleLineDraft> = {}): DubbingRoleLineDraft => ({
  id: patch.id ?? 'line-1',
  shotId: patch.shotId ?? 'shot-1',
  shotLabel: patch.shotLabel ?? '镜头 1',
  text: patch.text ?? '你好',
  audioUrl: patch.audioUrl,
  status: patch.status ?? 'idle',
})

const buildCard = (patch: Partial<DubbingRoleCardModel> = {}): DubbingRoleCardModel => ({
  id: patch.id ?? 'card-1',
  title: patch.title ?? '角色 1',
  imageUrl: patch.imageUrl ?? '',
  selectedVoiceId: patch.selectedVoiceId ?? 'voice-1',
  voiceOptions: patch.voiceOptions ?? [],
  lines: patch.lines ?? [buildLine()],
  createdAt: patch.createdAt ?? '2026-03-12 17:16',
  hidden: patch.hidden ?? false,
})

describe('dubbingBatchState', () => {
  it('detects generating and completed line states', () => {
    expect(isDubbingLineGenerating(buildLine({ status: 'pending' }))).toBe(true)
    expect(isDubbingLineGenerating(buildLine({ status: 'generating' }))).toBe(true)
    expect(isDubbingLineGenerating(buildLine({ status: 'failed' }))).toBe(false)

    expect(isDubbingLineCompleted(buildLine({ status: 'success', audioUrl: 'audio.mp3' }))).toBe(true)
    expect(isDubbingLineCompleted(buildLine({ status: 'success' }))).toBe(false)
  })

  it('detects completed and generating card states', () => {
    expect(isDubbingCardCompleted(buildCard({ lines: [buildLine({ status: 'success', audioUrl: 'audio.mp3' })] }))).toBe(true)
    expect(isDubbingCardCompleted(buildCard({ lines: [buildLine({ status: 'success' })] }))).toBe(false)

    expect(isDubbingCardGenerating(buildCard({ lines: [buildLine({ status: 'pending' })] }))).toBe(true)
    expect(isDubbingCardGenerating(buildCard({ lines: [buildLine({ status: 'generating' })] }))).toBe(true)
    expect(isDubbingCardGenerating(buildCard({ lines: [buildLine({ status: 'failed' })] }))).toBe(false)
  })

  it('returns a clear reason when there are no cards', () => {
    const availability = resolveDubbingBatchAvailability([])

    expect(availability.canGenerate).toBe(false)
    expect(availability.disabledReason).toBe('当前没有可配音的角色卡片')
  })

  it('returns eligible visible cards as batch targets', () => {
    const cards = [
      buildCard({ id: 'card-1' }),
      buildCard({ id: 'card-2', hidden: true }),
      buildCard({ id: 'card-3', lines: [] }),
      buildCard({ id: 'card-4', lines: [buildLine({ status: 'pending' })] }),
      buildCard({ id: 'card-5', lines: [buildLine({ status: 'success', audioUrl: 'audio.mp3' })] }),
      buildCard({ id: 'card-6', lines: [buildLine({ status: 'failed' })] }),
      buildCard({ id: 'card-7', lines: [buildLine({ status: 'success' })] }),
    ]

    const availability = resolveDubbingBatchAvailability(cards)

    expect(availability.targetIds).toEqual(['card-1', 'card-6', 'card-7'])
    expect(resolveDubbingBatchGenerateTargets(cards).map((card) => card.id)).toEqual(['card-1', 'card-6', 'card-7'])
  })

  it('reports when all cards are hidden', () => {
    const availability = resolveDubbingBatchAvailability([
      buildCard({ id: 'card-1', hidden: true }),
      buildCard({ id: 'card-2', hidden: true }),
    ])

    expect(availability.hiddenCount).toBe(2)
    expect(availability.disabledReason).toBe('当前角色配音卡片均已隐藏，无法批量配音')
  })

  it('reports when all visible cards are missing lines', () => {
    const availability = resolveDubbingBatchAvailability([
      buildCard({ id: 'card-1', lines: [] }),
      buildCard({ id: 'card-2', lines: [] }),
    ])

    expect(availability.emptyLineCount).toBe(2)
    expect(availability.disabledReason).toBe('当前角色配音卡片均没有台词，无法批量配音')
  })

  it('reports when all visible cards are already generating or completed', () => {
    const generatingAvailability = resolveDubbingBatchAvailability([
      buildCard({ id: 'card-1', lines: [buildLine({ status: 'generating' })] }),
      buildCard({ id: 'card-2', lines: [buildLine({ status: 'pending' })] }),
    ])
    expect(generatingAvailability.generatingCount).toBe(2)
    expect(generatingAvailability.disabledReason).toBe('当前角色配音正在生成中，请稍后再试')

    const completedAvailability = resolveDubbingBatchAvailability([
      buildCard({ id: 'card-1', lines: [buildLine({ status: 'success', audioUrl: 'audio-1.mp3' })] }),
      buildCard({ id: 'card-2', lines: [buildLine({ status: 'success', audioUrl: 'audio-2.mp3' })] }),
    ])
    expect(completedAvailability.completedCount).toBe(2)
    expect(completedAvailability.disabledReason).toBe('当前角色配音均已生成，无需重复生成')
  })

  it('builds single-card disabled reasons', () => {
    expect(buildDubbingCardGenerateDisabledReason(buildCard({ hidden: true }))).toBe('当前角色配音卡片已隐藏，无法生成配音')
    expect(buildDubbingCardGenerateDisabledReason(buildCard({ lines: [] }))).toBe('当前角色没有台词，无法生成配音')
    expect(buildDubbingCardGenerateDisabledReason(buildCard({ lines: [buildLine({ status: 'generating' })] }))).toBe(
      '当前角色配音正在生成中，请稍后再试',
    )
    expect(
      buildDubbingCardGenerateDisabledReason(
        buildCard({ lines: [buildLine({ status: 'success', audioUrl: 'audio.mp3' })] }),
      ),
    ).toBe('当前角色配音已生成，无需重复生成')
    expect(buildDubbingCardGenerateDisabledReason(buildCard())).toBe('')
  })

  it('keeps canBatchGenerateDubbingCard aligned with the availability logic', () => {
    expect(canBatchGenerateDubbingCard(buildCard())).toBe(true)
    expect(canBatchGenerateDubbingCard(buildCard({ hidden: true }))).toBe(false)
    expect(canBatchGenerateDubbingCard(buildCard({ lines: [] }))).toBe(false)
    expect(canBatchGenerateDubbingCard(buildCard({ lines: [buildLine({ status: 'pending' })] }))).toBe(false)
    expect(canBatchGenerateDubbingCard(buildCard({ lines: [buildLine({ status: 'generating' })] }))).toBe(false)
    expect(canBatchGenerateDubbingCard(buildCard({ lines: [buildLine({ status: 'success', audioUrl: 'audio.mp3' })] }))).toBe(
      false,
    )
    expect(canBatchGenerateDubbingCard(buildCard({ lines: [buildLine({ status: 'failed' })] }))).toBe(true)
    expect(canBatchGenerateDubbingCard(buildCard({ lines: [buildLine({ status: 'success' })] }))).toBe(true)
  })
})
