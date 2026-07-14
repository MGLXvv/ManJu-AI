import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultEditorDraft } from '@/mocks/editor.mock'
import { http } from '@/api/http'
import { editorHttpApi } from '@/api/modules/editor/editor.http'
import { API_ERROR_CODES } from '@/types/api-enums'
import { EDITOR_PERSISTENCE_PARTITIONS } from '@/types/editor'

vi.mock('@/api/http', () => ({
  http: {
    get: vi.fn(),
    put: vi.fn(),
  },
}))

describe('editorHttpApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads only the script workspace by default', async () => {
    vi.mocked(http.get).mockResolvedValueOnce({
      data: {
        rawText: 'source',
        prompt: 'prompt',
        scriptContent: 'generated',
        revision: 7,
        updateTime: '2026-06-25T10:00:00.000Z',
      },
    })

    const draft = await editorHttpApi.getDraft('project-1')

    expect(http.get).toHaveBeenCalledTimes(1)
    expect(http.get).toHaveBeenCalledWith('/aidrama/projects/project-1/script/workspace')
    expect(draft.script.generated).toBe('generated')
    expect(draft.revision).toBe(7)
    expect(draft.shots).toEqual([])
  })

  it('loads storyboard only when the caller explicitly requests it', async () => {
    vi.mocked(http.get)
      .mockResolvedValueOnce({
        data: {
          rawText: 'source',
          prompt: 'prompt',
          scriptContent: 'generated',
        },
      })
      .mockResolvedValueOnce({
        data: {
          storyboards: [
            {
              id: 101,
              title: '镜头一',
              content: '主角走入废墟',
              durationSeconds: 8,
              index: 1,
            },
          ],
        },
      })

    const draft = await editorHttpApi.getDraft('project-1', {
      partitions: [EDITOR_PERSISTENCE_PARTITIONS.script, EDITOR_PERSISTENCE_PARTITIONS.storyboard],
    })

    expect(http.get).toHaveBeenNthCalledWith(1, '/aidrama/projects/project-1/script/workspace')
    expect(http.get).toHaveBeenNthCalledWith(2, '/aidrama/projects/project-1/storyboard/workspace')
    expect(draft.shots).toHaveLength(1)
    expect(draft.shots[0].id).toBe('101')
    expect(draft.shots[0].description).toBe('主角走入废墟')
  })

  it('does not swallow storyboard workspace failures', async () => {
    vi.mocked(http.get)
      .mockResolvedValueOnce({ data: { rawText: 'source' } })
      .mockRejectedValueOnce(new Error('storyboard workspace failed'))

    await expect(
      editorHttpApi.getDraft('project-1', {
        partitions: [EDITOR_PERSISTENCE_PARTITIONS.script, EDITOR_PERSISTENCE_PARTITIONS.storyboard],
      }),
    ).rejects.toThrow('storyboard workspace failed')
  })

  it('rejects unimplemented workspace partitions instead of returning default data', async () => {
    await expect(
      editorHttpApi.getDraft('project-1', {
        partitions: [EDITOR_PERSISTENCE_PARTITIONS.setting],
      }),
    ).rejects.toMatchObject({ code: API_ERROR_CODES.editorPartitionHttpUnsupported })

    expect(http.get).not.toHaveBeenCalled()
  })

  it('saves source text and prompt without calling script content when generated is empty', async () => {
    vi.mocked(http.put).mockResolvedValue({ data: null })

    const result = await editorHttpApi.saveDraft(
      'project-1',
      {
        ...createDefaultEditorDraft('project-1'),
        revision: 3,
        script: {
          content: 'source',
          prompt: 'prompt',
          outline: '',
          generated: '',
          storyboard: '',
          updatedAt: '',
        },
      },
      { partitions: [EDITOR_PERSISTENCE_PARTITIONS.script], expectedRevision: 3 },
    )

    expect(http.put).toHaveBeenCalledWith('/aidrama/projects/project-1/script/draft', {
      rawText: 'source',
      prompt: 'prompt',
    })
    expect(http.put).toHaveBeenCalledTimes(1)
    expect(result.revision).toBe(3)
  })

  it('saves generated script content using the backend scriptContent field', async () => {
    vi.mocked(http.put)
      .mockResolvedValueOnce({ data: { revision: 4, updateTime: '2026-07-14T01:00:00.000Z' } })
      .mockResolvedValueOnce({ data: { revision: 5, updateTime: '2026-07-14T01:01:00.000Z' } })

    const result = await editorHttpApi.saveDraft(
      'project-1',
      {
        ...createDefaultEditorDraft('project-1'),
        revision: 3,
        script: {
          content: 'source',
          prompt: 'prompt',
          outline: '',
          generated: 'generated content',
          storyboard: '',
          updatedAt: '',
        },
      },
      { partitions: [EDITOR_PERSISTENCE_PARTITIONS.script], expectedRevision: 3 },
    )

    expect(http.put).toHaveBeenNthCalledWith(1, '/aidrama/projects/project-1/script/draft', {
      rawText: 'source',
      prompt: 'prompt',
    })
    expect(http.put).toHaveBeenNthCalledWith(2, '/aidrama/projects/project-1/script/content', {
      scriptContent: 'generated content',
    })
    expect(result.revision).toBe(5)
    expect(result.savedAt).toBe('2026-07-14T01:01:00.000Z')
  })

  it('rejects non-script saves until their workspace adapters are implemented', async () => {
    await expect(
      editorHttpApi.saveDraft('project-1', createDefaultEditorDraft('project-1'), {
        partitions: [EDITOR_PERSISTENCE_PARTITIONS.setting],
      }),
    ).rejects.toMatchObject({ code: API_ERROR_CODES.editorPartitionHttpUnsupported })

    expect(http.put).not.toHaveBeenCalled()
  })
})
