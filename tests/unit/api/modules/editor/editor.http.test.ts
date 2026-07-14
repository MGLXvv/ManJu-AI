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

  it('saves source text and prompt through the confirmed draft contract', async () => {
    vi.mocked(http.put).mockResolvedValue({
      data: { revision: 4, updateTime: '2026-07-14T01:00:00.000Z' },
    })

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
    expect(result.revision).toBe(4)
    expect(result.savedAt).toBe('2026-07-14T01:00:00.000Z')
  })

  it('rejects generated-content persistence until the backend request DTO is confirmed', async () => {
    const draft = {
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
    }

    await expect(
      editorHttpApi.saveDraft('project-1', draft, {
        partitions: [EDITOR_PERSISTENCE_PARTITIONS.script],
        expectedRevision: 3,
      }),
    ).rejects.toMatchObject({ code: API_ERROR_CODES.editorScriptContentContractUnconfirmed })

    expect(http.put).not.toHaveBeenCalled()
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
