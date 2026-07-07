import { describe, expect, it } from 'vitest'
import { createDefaultEditorDraft } from '@/mocks/editor.mock'
import { buildCompleteSummary } from '@/features/editor/completeSummaryState'

describe('completeSummaryState', () => {
  it('returns empty counts and flags when draft is missing', () => {
    const summary = buildCompleteSummary(null)

    expect(summary.shotCount).toBe(0)
    expect(summary.playableVideoCount).toBe(0)
    expect(summary.generatedAudioCount).toBe(0)
    expect(summary.hasPlayableVideo).toBe(false)
    expect(summary.hasGeneratedAudio).toBe(false)
  })

  it('counts only visible shots and playable videos', () => {
    const draft = createDefaultEditorDraft('project-complete')
    draft.shots = [
      {
        id: 'shot-1',
        index: 1,
        title: '镜头 1',
        description: '镜头 1 描述',
        characterIds: [],
        sceneIds: [],
        propIds: [],
        imageUrl: 'image-1.png',
        videoUrl: 'video-1.mp4',
        videoPrompt: '视频 1',
        dialogue: '',
        durationSeconds: 10,
        voiceAssignments: [],
        style: '写实',
        ratio: '16:9',
        status: 'success',
        isHidden: false,
        isLocked: false,
        storyboardReviewed: false,
        referenceImages: [],
        createdAt: '2026-03-12 17:16',
      },
      {
        id: 'shot-2',
        index: 2,
        title: '镜头 2',
        description: '镜头 2 描述',
        characterIds: [],
        sceneIds: [],
        propIds: [],
        imageUrl: 'image-2.png',
        videoUrl: 'video-2.mp4',
        videoPrompt: '视频 2',
        dialogue: '',
        durationSeconds: 10,
        voiceAssignments: [],
        style: '写实',
        ratio: '16:9',
        status: 'success',
        isHidden: true,
        isLocked: false,
        storyboardReviewed: false,
        referenceImages: [],
        createdAt: '2026-03-12 17:16',
      },
      {
        id: 'shot-3',
        index: 3,
        title: '镜头 3',
        description: '镜头 3 描述',
        characterIds: [],
        sceneIds: [],
        propIds: [],
        imageUrl: 'image-3.png',
        videoUrl: '',
        videoPrompt: '视频 3',
        dialogue: '',
        durationSeconds: 10,
        voiceAssignments: [],
        style: '写实',
        ratio: '16:9',
        status: 'pending-review',
        isHidden: false,
        isLocked: false,
        storyboardReviewed: false,
        referenceImages: [],
        createdAt: '2026-03-12 17:16',
      },
    ]

    const summary = buildCompleteSummary(draft)

    expect(summary.shotCount).toBe(2)
    expect(summary.playableVideoCount).toBe(1)
    expect(summary.hasPlayableVideo).toBe(true)
  })

  it('counts only visible dubbing cards and generated audio lines', () => {
    const draft = createDefaultEditorDraft('project-complete')
    draft.dubbing.cards = [
      {
        id: 'card-1',
        selectedVoiceId: 'voice-1',
        hidden: false,
        lines: [
          {
            id: 'line-1',
            shotId: 'shot-1',
            shotLabel: '镜头 1',
            text: '你好',
            status: 'success',
            audioUrl: 'audio-1.mp3',
          },
          {
            id: 'line-2',
            shotId: 'shot-2',
            shotLabel: '镜头 2',
            text: '未生成',
            status: 'idle',
            audioUrl: '',
          },
        ],
      },
      {
        id: 'card-2',
        selectedVoiceId: 'voice-2',
        hidden: true,
        lines: [
          {
            id: 'line-3',
            shotId: 'shot-3',
            shotLabel: '镜头 3',
            text: '隐藏音频',
            status: 'success',
            audioUrl: 'audio-2.mp3',
          },
        ],
      },
    ]

    const summary = buildCompleteSummary(draft)

    expect(summary.generatedAudioCount).toBe(1)
    expect(summary.hasGeneratedAudio).toBe(true)
  })

  it('returns stable empty-state copy when there is no video or audio', () => {
    const draft = createDefaultEditorDraft('project-complete')

    const summary = buildCompleteSummary(draft)

    expect(summary.hasPlayableVideo).toBe(false)
    expect(summary.hasGeneratedAudio).toBe(false)
    expect(summary.videoEmptyText).toContain('暂无可预览视频片段')
    expect(summary.audioEmptyText).toContain('暂无已生成配音结果')
    expect(summary.exportNoticeText).toContain('剪映工程导出')
  })
})
