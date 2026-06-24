import { describe, expect, it } from 'vitest'
import {
  getBackendScriptGeneratedContent,
  mapBackendScriptWorkspaceToDraft,
} from '@/api/modules/editor/script.mapper'

describe('script.mapper', () => {
  it('maps raw text, prompt, content and update time into script draft', () => {
    const draft = mapBackendScriptWorkspaceToDraft('project-1', {
      rawText: 'source text',
      prompt: 'prompt text',
      content: 'generated script',
      updateTime: '2026-06-25T10:00:00.000Z',
    })

    expect(draft.projectId).toBe('project-1')
    expect(draft.script.content).toBe('source text')
    expect(draft.script.prompt).toBe('prompt text')
    expect(draft.script.generated).toBe('generated script')
    expect(draft.script.updatedAt).toBe('2026-06-25T10:00:00.000Z')
  })

  it('falls back to scriptContent and updatedAt when content fields differ', () => {
    expect(
      getBackendScriptGeneratedContent({
        scriptContent: 'compat generated script',
      }),
    ).toBe('compat generated script')

    const draft = mapBackendScriptWorkspaceToDraft('project-2', {
      rawText: 'raw',
      prompt: 'prompt',
      scriptContent: 'compat generated script',
      updatedAt: '2026-06-25T11:00:00.000Z',
    })

    expect(draft.script.generated).toBe('compat generated script')
    expect(draft.script.updatedAt).toBe('2026-06-25T11:00:00.000Z')
  })

  it('returns empty generated content when backend result fields are missing', () => {
    const draft = mapBackendScriptWorkspaceToDraft('project-3', {
      rawText: 'raw',
      prompt: 'prompt',
    })

    expect(draft.script.generated).toBe('')
    expect(Array.isArray(draft.shots)).toBe(true)
  })
})
