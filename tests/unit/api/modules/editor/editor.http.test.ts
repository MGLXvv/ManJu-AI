import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultEditorDraft } from '@/mocks/editor.mock'
import { http } from '@/api/http'
import { editorHttpApi } from '@/api/modules/editor/editor.http'

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

  it('loads draft from script workspace endpoint', async () => {
    vi.mocked(http.get)
      .mockResolvedValueOnce({
        data: {
          rawText: 'source',
          prompt: 'prompt',
          content: 'generated',
          updateTime: '2026-06-25T10:00:00.000Z',
        },
      })
      .mockResolvedValueOnce({
        data: {
          storyboards: [],
        },
      })

    const draft = await editorHttpApi.getDraft('project-1')

    expect(http.get).toHaveBeenCalledWith('/aidrama/projects/project-1/script/workspace')
    expect(draft.script.generated).toBe('generated')
  })

  it('merges storyboard workspace shots into the draft', async () => {
    vi.mocked(http.get)
      .mockResolvedValueOnce({
        data: {
          rawText: 'source',
          prompt: 'prompt',
          content: 'generated',
          updateTime: '2026-06-25T10:00:00.000Z',
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

    const draft = await editorHttpApi.getDraft('project-1')

    expect(http.get).toHaveBeenNthCalledWith(2, '/aidrama/projects/project-1/storyboard/workspace')
    expect(draft.shots).toHaveLength(1)
    expect(draft.shots[0].id).toBe('101')
    expect(draft.shots[0].description).toBe('主角走入废墟')
  })

  it('keeps script draft data when storyboard workspace request fails', async () => {
    vi.mocked(http.get)
      .mockResolvedValueOnce({
        data: {
          rawText: 'source',
          prompt: 'prompt',
          content: 'generated',
          updateTime: '2026-06-25T10:00:00.000Z',
        },
      })
      .mockRejectedValueOnce(new Error('storyboard workspace failed'))

    const draft = await editorHttpApi.getDraft('project-1')

    expect(draft.script.content).toBe('source')
    expect(Array.isArray(draft.shots)).toBe(true)
  })

  it('saves source text and prompt without calling script content when generated is empty', async () => {
    vi.mocked(http.put).mockResolvedValue({ data: undefined })

    await editorHttpApi.saveDraft('project-1', {
      ...createDefaultEditorDraft('project-1'),
      script: {
        content: 'source',
        prompt: 'prompt',
        generated: '',
        updatedAt: '',
      },
    })

    expect(http.put).toHaveBeenCalledWith('/aidrama/projects/project-1/script/draft', {
      rawText: 'source',
      prompt: 'prompt',
    })
    expect(http.put).toHaveBeenCalledTimes(1)
  })

  it('saves generated script content when generated text is present', async () => {
    vi.mocked(http.put).mockResolvedValue({ data: undefined })

    await editorHttpApi.saveDraft('project-1', {
      ...createDefaultEditorDraft('project-1'),
      script: {
        content: 'source',
        prompt: 'prompt',
        generated: 'generated content',
        updatedAt: '',
      },
    })

    expect(http.put).toHaveBeenNthCalledWith(1, '/aidrama/projects/project-1/script/draft', {
      rawText: 'source',
      prompt: 'prompt',
    })
    expect(http.put).toHaveBeenNthCalledWith(2, '/aidrama/projects/project-1/script/content', {
      content: 'generated content',
    })
  })
})
