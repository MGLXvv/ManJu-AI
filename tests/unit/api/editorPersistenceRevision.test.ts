import { describe, expect, it } from 'vitest'
import { editorApi } from '@/api/editor.api'
import { createDefaultEditorDraft } from '@/mocks/editor.mock'
import { API_ERROR_CODES } from '@/types/api-enums'
import { EDITOR_PERSISTENCE_PARTITIONS } from '@/types/editor'

describe('editor persistence revision contract', () => {
  it('increments revisions and rejects stale saves', async () => {
    const projectId = `editor-revision-${Date.now()}`
    const firstDraft = createDefaultEditorDraft(projectId)
    firstDraft.script.content = 'first version'

    const first = await editorApi.saveDraft(projectId, firstDraft, {
      expectedRevision: 0,
      partitions: [EDITOR_PERSISTENCE_PARTITIONS.script],
      reason: 'manual',
    })

    expect(first.revision).toBe(1)
    expect(first.draft.revision).toBe(1)

    const staleDraft = createDefaultEditorDraft(projectId)
    staleDraft.script.content = 'stale version'

    await expect(
      editorApi.saveDraft(projectId, staleDraft, {
        expectedRevision: 0,
        partitions: [EDITOR_PERSISTENCE_PARTITIONS.script],
        reason: 'manual',
      }),
    ).rejects.toMatchObject({
      code: API_ERROR_CODES.editorSaveConflict,
      status: 409,
      details: expect.objectContaining({
        currentRevision: 1,
        expectedRevision: 0,
      }),
    })

    const restored = await editorApi.getDraft(projectId)
    expect(restored.revision).toBe(1)
    expect(restored.script.content).toBe('first version')
  })
})
