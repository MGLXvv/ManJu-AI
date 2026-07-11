import { describe, expect, it } from 'vitest'
import { createDefaultEditorDraft } from '@/mocks/editor.mock'
import { storyboardShotsMock } from '@/mocks/storyboard.mock'
import {
  buildDubbingExportPayload,
  buildDubbingArtifact,
  buildDubbingExportFileName,
  buildStoryboardArtifact,
  buildStoryboardExportFileName,
  buildVideoArtifact,
  buildVideoExportFileName,
} from '@/features/editor/editorArtifactMapper'

describe('editorArtifactMapper', () => {
  it('builds a storyboard artifact envelope from storyboard shots', () => {
    const artifact = buildStoryboardArtifact('project-storyboard', [storyboardShotsMock[0]!])

    expect(artifact.artifact).toBe('storyboard')
    expect(artifact.projectId).toBe('project-storyboard')
    expect(artifact.payload.shots[0]?.title).toBe(storyboardShotsMock[0]?.title)
  })

  it('builds a video artifact envelope from persisted draft shots', () => {
    const draft = createDefaultEditorDraft('project-video')
    draft.shots = [
      {
        id: 'shot-1',
        index: 1,
        title: '镜头 1',
        description: '视频描述',
        characterIds: ['ch-1'],
        sceneIds: ['sc-1'],
        propIds: ['pr-1'],
        videoPrompt: '镜头缓慢推进',
        dialogue: '测试对白',
        durationSeconds: 5,
        status: 'success',
        referenceImages: [],
      },
    ]

    const artifact = buildVideoArtifact('project-video', draft.shots)

    expect(artifact.artifact).toBe('video')
    expect(artifact.payload.shots).toHaveLength(1)
    expect(artifact.payload.shots[0]?.videoPrompt).toBe('镜头缓慢推进')
  })

  it('builds a dubbing artifact envelope from the dubbing draft', () => {
    const draft = createDefaultEditorDraft('project-dubbing')
    draft.dubbing.cards = [
      {
        id: 'card-1',
        selectedVoiceId: 'voice-1',
        hidden: false,
        lines: [
          {
            id: 'line-1',
            shotId: 'shot-1',
            shotLabel: '镜头1',
            text: '今晚的风，比想象中更冷。',
            status: 'success',
          },
        ],
      },
    ]

    const artifact = buildDubbingArtifact('project-dubbing', draft.dubbing)

    expect(artifact.artifact).toBe('dubbing')
    expect(artifact.payload.dubbing.cards[0]?.lines[0]?.text).toContain('今晚的风')
  })

  it('removes transient URLs from exports while preserving stable media ids', () => {
    const draft = createDefaultEditorDraft('project-media-export')
    draft.shots = [
      {
        id: 'shot-1',
        index: 1,
        title: '镜头 1',
        description: '媒体测试',
        characterIds: [],
        sceneIds: [],
        propIds: [],
        imageUrl: 'blob:local-image',
        imageMediaId: 'media-image-1',
        videoUrl: 'data:video/mp4;base64,bW9jaw==',
        videoMediaId: 'media-video-1',
        status: 'success',
        referenceImages: [
          {
            id: 'ref-1',
            url: 'blob:reference-image',
            mediaId: 'media-reference-1',
          },
        ],
      },
    ]
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
            text: '测试对白',
            audioUrl: 'blob:local-audio',
            audioMediaId: 'media-audio-1',
            status: 'success',
          },
        ],
      },
    ]

    const videoArtifact = buildVideoArtifact('project-media-export', draft.shots)
    const dubbingArtifact = buildDubbingArtifact('project-media-export', draft.dubbing)
    const exportedShot = videoArtifact.payload.shots[0]
    const exportedLine = dubbingArtifact.payload.dubbing.cards[0]?.lines[0]

    expect(exportedShot).toMatchObject({
      imageUrl: '',
      imageMediaId: 'media-image-1',
      videoUrl: '',
      videoMediaId: 'media-video-1',
    })
    expect(exportedShot?.referenceImages?.[0]).toMatchObject({
      url: '',
      mediaId: 'media-reference-1',
    })
    expect(exportedLine).toMatchObject({
      audioUrl: '',
      audioMediaId: 'media-audio-1',
    })
  })

  it('builds stable export file names by artifact kind', () => {
    expect(buildStoryboardExportFileName('project-1')).toBe('project-1-storyboard.json')
    expect(buildVideoExportFileName('project-1')).toBe('project-1-video.json')
    expect(buildDubbingExportFileName('project-1')).toBe('project-1-dubbing.json')
  })

  it('excludes hidden dubbing cards from exported dubbing artifacts by default', () => {
    const draft = createDefaultEditorDraft('project-dubbing')
    draft.dubbing.cards = [
      {
        id: 'card-1',
        selectedVoiceId: 'voice-1',
        hidden: false,
        lines: [],
      },
      {
        id: 'card-2',
        selectedVoiceId: 'voice-2',
        hidden: true,
        lines: [],
      },
    ]

    const artifact = buildDubbingArtifact('project-dubbing', draft.dubbing)

    expect(artifact.payload.dubbing.cards.map((card) => card.id)).toEqual(['card-1'])
  })

  it('can include hidden dubbing cards when explicitly requested', () => {
    const draft = createDefaultEditorDraft('project-dubbing')
    draft.dubbing.cards = [
      {
        id: 'card-1',
        selectedVoiceId: 'voice-1',
        hidden: false,
        lines: [],
      },
      {
        id: 'card-2',
        selectedVoiceId: 'voice-2',
        hidden: true,
        lines: [],
      },
    ]

    const payload = buildDubbingExportPayload(draft.dubbing, { includeHidden: true })

    expect(payload.dubbing.cards.map((card) => card.id)).toEqual(['card-1', 'card-2'])
  })
})
