import { hasAnyMockFailureToken } from '@/features/shared/mockFailureState'
import { normalizeEditorDraft } from '@/features/editor/editorDraftMapper'
import { API_ERROR_CODES } from '@/types/api-enums'
import type { EditorGetDraftResponseDTO, EditorSaveDraftRequestDTO, EditorSaveDraftResponseDTO } from '@/types/api-dto'
import type { EditorDraft, SaveDraftResult } from '@/types/editor'
import { createApiError } from './errors'
import { delay, readLocal, writeLocal } from './local'

const EDITOR_KEY = 'amd.editor.drafts'

const getDraftMap = (): Record<string, EditorDraft> => readLocal<Record<string, EditorDraft>>(EDITOR_KEY, {})
const setDraftMap = (drafts: Record<string, EditorDraft>): void => writeLocal(EDITOR_KEY, drafts)

export const editorApi = {
  async getDraft(projectId: string): Promise<EditorDraft> {
    await delay()
    const drafts = getDraftMap()
    const response: EditorGetDraftResponseDTO = {
      draft: normalizeEditorDraft(projectId, drafts[projectId]),
    }
    return response.draft
  },

  async saveDraft(projectId: string, draft: EditorDraft): Promise<SaveDraftResult> {
    await delay(80)
    const request: EditorSaveDraftRequestDTO = { projectId, draft }

    const shouldFailSave =
      hasAnyMockFailureToken(
        [request.draft.script.content, request.draft.script.prompt, request.draft.script.generated],
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
    const normalized = normalizeEditorDraft(request.projectId, request.draft)
    const savedAt = new Date().toISOString()
    const next = {
      ...normalized,
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
    }
    return response
  },
}
