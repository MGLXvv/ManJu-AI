import { hasAnyMockFailureToken } from '@/features/shared/mockFailureState'
import { normalizeEditorDraft } from '@/features/editor/editorDraftMapper'
import { API_ERROR_CODES } from '@/types/api-enums'
import type { EditorGetDraftResponseDTO, EditorSaveDraftRequestDTO, EditorSaveDraftResponseDTO } from '@/types/api-dto'
import { createApiError } from '@/api/errors'
import { delay, readLocal, writeLocal } from '@/api/local'
import type { EditorApiContract, EditorDraft } from './editor.types'

const EDITOR_KEY = 'amd.editor.drafts'

const getDraftMap = (): Record<string, EditorDraft> => readLocal<Record<string, EditorDraft>>(EDITOR_KEY, {})
const setDraftMap = (drafts: Record<string, EditorDraft>): void => writeLocal(EDITOR_KEY, drafts)

export const editorMockApi: EditorApiContract = {
  async getDraft(projectId) {
    await delay()
    const drafts = getDraftMap()
    const response: EditorGetDraftResponseDTO = {
      draft: normalizeEditorDraft(projectId, drafts[projectId]),
    }
    return response.draft
  },

  async saveDraft(projectId, draft, options = {}) {
    await delay(80)
    const request: EditorSaveDraftRequestDTO = { projectId, draft }

    const shouldFailSave =
      hasAnyMockFailureToken(
        [request.draft.script.content, request.draft.script.prompt, request.draft.script.outline, request.draft.script.generated, request.draft.script.storyboard],
        ['#mock-save-fail'],
      ) ||
      request.draft.shots.some((shot) =>
        hasAnyMockFailureToken(
          [shot.title, shot.description, shot.videoPrompt ?? '', shot.dialogue ?? ''],
          ['#mock-save-fail'],
        ),
      ) ||
      request.draft.dubbing.cards.some(
        (card) =>
          hasAnyMockFailureToken([card.selectedVoiceId], ['#mock-save-fail']) ||
          card.lines.some((line) => hasAnyMockFailureToken([line.text], ['#mock-save-fail'])),
      )

    if (shouldFailSave) {
      throw createApiError({
        message: 'Editor draft save failed',
        code: API_ERROR_CODES.editorSaveFailed,
        status: 422,
      })
    }

    const drafts = getDraftMap()
    const current = normalizeEditorDraft(request.projectId, drafts[request.projectId])
    const currentRevision = current.revision ?? 0

    if (options.expectedRevision !== undefined && options.expectedRevision !== currentRevision) {
      throw createApiError({
        message: 'Editor draft revision conflict',
        code: API_ERROR_CODES.editorSaveConflict,
        status: 409,
        details: {
          projectId: request.projectId,
          expectedRevision: options.expectedRevision,
          currentRevision,
        },
      })
    }

    const normalized = normalizeEditorDraft(request.projectId, request.draft)
    const savedAt = new Date().toISOString()
    const revision = currentRevision + 1
    const next: EditorDraft = {
      ...normalized,
      revision,
      script: {
        ...normalized.script,
        updatedAt: savedAt,
      },
    }
    drafts[request.projectId] = next
    setDraftMap(drafts)
    const response: EditorSaveDraftResponseDTO = {
      draft: next,
      savedAt,
      revision,
    }
    return response
  },
}
