import { normalizeEditorDraft } from '@/features/editor/editorDraftMapper'
import type { BackendScriptWorkspaceDTO } from '@/types/api-dto'
import type { EditorDraft } from './editor.types'

type VersionedScriptWorkspace = BackendScriptWorkspaceDTO & {
  revision?: unknown
  version?: unknown
}

export const getBackendScriptGeneratedContent = (workspace?: BackendScriptWorkspaceDTO): string =>
  workspace?.content || workspace?.scriptContent || workspace?.generatedContent || ''

export const getBackendScriptRevision = (workspace?: BackendScriptWorkspaceDTO): number => {
  const versioned = workspace as VersionedScriptWorkspace | undefined
  const candidate = versioned?.revision ?? versioned?.version
  return typeof candidate === 'number' && Number.isFinite(candidate) ? Math.max(0, Math.floor(candidate)) : 0
}

export const mapBackendScriptWorkspaceToDraft = (
  projectId: string,
  workspace?: BackendScriptWorkspaceDTO,
): EditorDraft =>
  normalizeEditorDraft(projectId, {
    projectId,
    revision: getBackendScriptRevision(workspace),
    script: {
      content: workspace?.rawText || '',
      prompt: workspace?.prompt || '',
      generated: getBackendScriptGeneratedContent(workspace),
      storyboard: '',
      updatedAt: workspace?.updateTime || workspace?.updatedAt || '',
    },
  } as Partial<EditorDraft> as EditorDraft)
