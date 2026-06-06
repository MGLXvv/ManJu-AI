import { describe, expect, it } from 'vitest'
import type { DubbingRoleCardModel } from '@/types/dubbing'
import { buildDubbingExportFileName, validateDubbingBeforeComplete } from './dubbingPersistState'

const makeCard = (overrides: Partial<DubbingRoleCardModel> = {}): DubbingRoleCardModel => ({
  id: 'asset-char-1',
  title: '赵灵儿',
  imageUrl: 'image-1',
  selectedVoiceId: 'male-mid-deep',
  voiceOptions: [{ id: 'male-mid-deep', name: '浑厚男中音' }],
  createdAt: '2026年3月12日 17:16',
  hidden: false,
  lines: [
    {
      id: 'asset-char-1-shot-1',
      shotId: 'shot-1',
      shotLabel: '镜头1',
      text: '这段对白需要配音',
      status: 'idle',
    },
  ],
  ...overrides,
})

describe('dubbingPersistState', () => {
  it('builds safe export file name', () => {
    expect(buildDubbingExportFileName('project:demo/01')).toBe('project-demo-01-dubbing.json')
  })

  it('blocks entering complete when no generated audio exists', () => {
    expect(validateDubbingBeforeComplete([makeCard()])).toEqual({
      ok: false,
      message: '请至少生成一条配音后再进入完成页',
    })
  })

  it('allows entering complete when at least one generated audio exists', () => {
    expect(
      validateDubbingBeforeComplete([
        makeCard({
          lines: [
            {
              id: 'asset-char-1-shot-1',
              shotId: 'shot-1',
              shotLabel: '镜头1',
              text: '这段对白需要配音',
              audioUrl: 'mock-audio://1',
              status: 'success',
            },
          ],
        }),
      ]),
    ).toEqual({
      ok: true,
      message: '',
    })
  })
})
