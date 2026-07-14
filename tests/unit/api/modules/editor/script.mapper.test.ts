import { describe, expect, it } from 'vitest'
import {
  getBackendScriptGeneratedContent,
  getBackendScriptRevision,
  mapBackendScriptWorkspaceToDraft,
} from '@/api/modules/editor/script.mapper'

describe('script workspace mapper', () => {
  it('maps confirmed script fields and revision metadata', () => {
    const draft = mapBackendScriptWorkspaceToDraft('project-1', {
      rawText: '原始文案',
      prompt: '生成提示词',
      content: '生成剧本',
      updateTime: '2026-07-14T01:00:00.000Z',
      revision: 8,
    } as never)

    expect(draft.projectId).toBe('project-1')
    expect(draft.revision).toBe(8)
    expect(draft.script).toMatchObject({
      content: '原始文案',
      prompt: '生成提示词',
      generated: '生成剧本',
      updatedAt: '2026-07-14T01:00:00.000Z',
    })
    expect(draft.settingAssets).toEqual([])
    expect(draft.shots).toEqual([])
  })

  it('uses compatible generated-content, timestamp and version fields', () => {
    expect(getBackendScriptGeneratedContent({ scriptContent: 'script-content' })).toBe('script-content')
    expect(getBackendScriptGeneratedContent({ generatedContent: 'generated-content' })).toBe('generated-content')

    const draft = mapBackendScriptWorkspaceToDraft('project-1', {
      generatedContent: 'generated-content',
      updatedAt: '2026-07-14T02:00:00.000Z',
      version: 3,
    } as never)

    expect(draft.script.generated).toBe('generated-content')
    expect(draft.script.updatedAt).toBe('2026-07-14T02:00:00.000Z')
    expect(draft.revision).toBe(3)
  })

  it('falls back to empty fields and revision zero', () => {
    const draft = mapBackendScriptWorkspaceToDraft('project-1')

    expect(draft.revision).toBe(0)
    expect(draft.script.content).toBe('')
    expect(draft.script.prompt).toBe('')
    expect(draft.script.generated).toBe('')
    expect(getBackendScriptRevision(undefined)).toBe(0)
  })
})
