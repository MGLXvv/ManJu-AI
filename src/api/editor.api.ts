import { createDefaultEditorDraft } from '@/mocks/editor.mock'
import type { EditorDraft } from '@/types/editor'
import { hasAnyMockFailureToken } from '@/features/shared/mockFailureState'
import { delay, readLocal, writeLocal } from './local'

const EDITOR_KEY = 'amd.editor.drafts'

const getDraftMap = (): Record<string, EditorDraft> => readLocal<Record<string, EditorDraft>>(EDITOR_KEY, {})
const setDraftMap = (drafts: Record<string, EditorDraft>): void => writeLocal(EDITOR_KEY, drafts)

const normalizeDraft = (projectId: string, draft?: EditorDraft): EditorDraft => {
  const fallback = createDefaultEditorDraft(projectId)
  if (!draft) {
    return fallback
  }

  return {
    ...fallback,
    ...draft,
    script: {
      ...fallback.script,
      ...draft.script,
    },
    dubbing: {
      ...fallback.dubbing,
      ...draft.dubbing,
      cards:
        draft.dubbing?.cards?.map((card) => ({
          ...card,
          lines: card.lines.map((line) => ({ ...line })),
        })) ?? fallback.dubbing.cards,
    },
  }
}

export const editorApi = {
  async getDraft(projectId: string): Promise<EditorDraft> {
    await delay()
    const drafts = getDraftMap()
    return normalizeDraft(projectId, drafts[projectId])
  },

  async saveDraft(projectId: string, draft: EditorDraft): Promise<EditorDraft> {
    await delay(80)

    const shouldFailSave =
      hasAnyMockFailureToken(
        [draft.script.content, draft.script.prompt, draft.script.generated],
        ['#mock-save-fail'],
      ) ||
      draft.shots.some((shot) =>
        hasAnyMockFailureToken(
          [shot.title, shot.description, shot.videoPrompt ?? '', shot.dialogue ?? ''],
          ['#mock-save-fail'],
        ),
      ) ||
      draft.dubbing.cards.some(
        (card) =>
          hasAnyMockFailureToken([card.selectedVoiceId], ['#mock-save-fail']) ||
          card.lines.some((line) => hasAnyMockFailureToken([line.text], ['#mock-save-fail'])),
      )

    if (shouldFailSave) {
      throw new Error('EDITOR_SAVE_FAILED')
    }

    const drafts = getDraftMap()
    const normalized = normalizeDraft(projectId, draft)
    const next = {
      ...normalized,
      script: {
        ...normalized.script,
        updatedAt: new Date().toISOString(),
      },
    }
    drafts[projectId] = next
    setDraftMap(drafts)
    return next
  },
}
