import { createApiError } from '@/api/errors'
import { http } from '@/api/http'
import { normalizeEditorDraft } from '@/features/editor/editorDraftMapper'
import { API_ERROR_CODES } from '@/types/api-enums'
import { EDITOR_PERSISTENCE_PARTITIONS, type EditorPersistencePartition } from '@/types/editor'
import { mapBackendScriptWorkspaceToDraft } from './script.mapper'
import { mapBackendStoryboardWorkspaceToDraftPatch } from './storyboard.mapper'
import type { EditorApiContract, EditorLoadDraftOptions } from './editor.types'
import type { BackendScriptWorkspaceDTO, BackendStoryboardWorkspaceDTO } from '@/types/api-dto'

interface BackendScriptSaveResponse {
  revision?: unknown
  version?: unknown
  updateTime?: string | null
  updatedAt?: string | null
}

const HTTP_LOAD_PARTITIONS = new Set<EditorPersistencePartition>([
  EDITOR_PERSISTENCE_PARTITIONS.script,
  EDITOR_PERSISTENCE_PARTITIONS.storyboard,
])

const assertSupportedPartitions = (
  partitions: EditorPersistencePartition[],
  supported: Set<EditorPersistencePartition>,
  operation: 'load' | 'save',
): void => {
  const unsupported = partitions.filter((partition) => !supported.has(partition))
  if (unsupported.length === 0) return

  throw createApiError({
    message: `Editor ${operation} is not supported for partitions: ${unsupported.join(', ')}`,
    code: API_ERROR_CODES.editorPartitionHttpUnsupported,
    details: { operation, unsupportedPartitions: unsupported },
  })
}

const resolveLoadPartitions = (options?: EditorLoadDraftOptions): EditorPersistencePartition[] =>
  options?.partitions?.length ? [...new Set(options.partitions)] : [EDITOR_PERSISTENCE_PARTITIONS.script]

const resolveSaveRevision = (
  response: BackendScriptSaveResponse | null | undefined,
  fallback: number,
): number => {
  const candidate = response?.revision ?? response?.version
  return typeof candidate === 'number' && Number.isFinite(candidate)
    ? Math.max(0, Math.floor(candidate))
    : fallback
}

const resolveSavedAt = (
  response: BackendScriptSaveResponse | null | undefined,
  fallback: string,
): string => response?.updateTime || response?.updatedAt || fallback

export const editorHttpApi: EditorApiContract = {
  async getDraft(projectId, options) {
    const partitions = resolveLoadPartitions(options)
    assertSupportedPartitions(partitions, HTTP_LOAD_PARTITIONS, 'load')

    let draft = normalizeEditorDraft(projectId)

    if (partitions.includes(EDITOR_PERSISTENCE_PARTITIONS.script)) {
      const { data: scriptWorkspace } = await http.get<BackendScriptWorkspaceDTO>(
        `/aidrama/projects/${projectId}/script/workspace`,
      )
      draft = mapBackendScriptWorkspaceToDraft(projectId, scriptWorkspace)
    }

    if (partitions.includes(EDITOR_PERSISTENCE_PARTITIONS.storyboard)) {
      const { data: storyboardWorkspace } = await http.get<BackendStoryboardWorkspaceDTO>(
        `/aidrama/projects/${projectId}/storyboard/workspace`,
      )
      draft = normalizeEditorDraft(projectId, {
        ...draft,
        ...mapBackendStoryboardWorkspaceToDraftPatch(storyboardWorkspace),
      })
    }

    return draft
  },

  async saveDraft(projectId, draft, options = {}) {
    const partitions = options.partitions?.length
      ? [...new Set(options.partitions)]
      : [EDITOR_PERSISTENCE_PARTITIONS.script]
    const supportedSavePartitions = new Set<EditorPersistencePartition>([
      EDITOR_PERSISTENCE_PARTITIONS.script,
    ])
    assertSupportedPartitions(partitions, supportedSavePartitions, 'save')

    const fallbackRevision = options.expectedRevision ?? draft.revision ?? 0
    if (!partitions.includes(EDITOR_PERSISTENCE_PARTITIONS.script)) {
      return {
        draft,
        savedAt: draft.script.updatedAt || new Date().toISOString(),
        revision: fallbackRevision,
      }
    }

    const { data: draftSaveResponse } = await http.put<BackendScriptSaveResponse | null>(
      `/aidrama/projects/${projectId}/script/draft`,
      {
        rawText: draft.script.content,
        prompt: draft.script.prompt,
      },
    )

    let latestResponse = draftSaveResponse
    if (draft.script.generated.trim()) {
      const { data: contentSaveResponse } = await http.put<BackendScriptSaveResponse | null>(
        `/aidrama/projects/${projectId}/script/content`,
        {
          content: draft.script.generated,
        },
      )
      latestResponse = contentSaveResponse ?? draftSaveResponse
    }

    const now = new Date().toISOString()
    const savedAt = resolveSavedAt(latestResponse, now)
    const revision = resolveSaveRevision(latestResponse, fallbackRevision)

    return {
      draft: {
        ...draft,
        revision,
        script: {
          ...draft.script,
          updatedAt: savedAt,
        },
      },
      savedAt,
      revision,
    }
  },
}
