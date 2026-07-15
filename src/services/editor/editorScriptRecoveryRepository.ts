import { readLocal, removeLocal, writeLocal } from '@/api/local'
import { cloneScriptDraft } from '@/features/editor/editorDraftMapper'
import type { ScriptDraft } from '@/types/editor'

export const EDITOR_SCRIPT_RECOVERY_STORAGE_KEY = 'amd.editor.script-recovery'

export interface EditorScriptRecoveryRecord {
  projectId: string
  baseRevision: number
  baseline: ScriptDraft
  draft: ScriptDraft
  savedLocallyAt: string
}

export interface EditorScriptRecoveryWriteInput {
  projectId: string
  baseRevision: number
  baseline: ScriptDraft
  draft: ScriptDraft
}

export interface EditorScriptRecoveryStore {
  read(projectId: string): EditorScriptRecoveryRecord | null
  write(input: EditorScriptRecoveryWriteInput): EditorScriptRecoveryRecord
  remove(projectId: string): void
}

const isScriptDraft = (value: unknown): value is ScriptDraft => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<ScriptDraft>
  return (
    typeof candidate.content === 'string' &&
    typeof candidate.prompt === 'string' &&
    typeof candidate.outline === 'string' &&
    typeof candidate.generated === 'string' &&
    typeof candidate.storyboard === 'string' &&
    typeof candidate.updatedAt === 'string'
  )
}

const isRecoveryRecord = (value: unknown): value is EditorScriptRecoveryRecord => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<EditorScriptRecoveryRecord>
  return (
    typeof candidate.projectId === 'string' &&
    typeof candidate.baseRevision === 'number' &&
    Number.isFinite(candidate.baseRevision) &&
    isScriptDraft(candidate.baseline) &&
    isScriptDraft(candidate.draft) &&
    typeof candidate.savedLocallyAt === 'string'
  )
}

const cloneRecord = (record: EditorScriptRecoveryRecord): EditorScriptRecoveryRecord => ({
  ...record,
  baseline: cloneScriptDraft(record.baseline),
  draft: cloneScriptDraft(record.draft),
})

const readRecoveryMap = (): Record<string, unknown> =>
  readLocal<Record<string, unknown>>(EDITOR_SCRIPT_RECOVERY_STORAGE_KEY, {})

export class EditorScriptRecoveryRepository implements EditorScriptRecoveryStore {
  constructor(private readonly now: () => string = () => new Date().toISOString()) {}

  read(projectId: string): EditorScriptRecoveryRecord | null {
    const value = readRecoveryMap()[projectId]
    if (!isRecoveryRecord(value) || value.projectId !== projectId) {
      return null
    }

    return cloneRecord(value)
  }

  write(input: EditorScriptRecoveryWriteInput): EditorScriptRecoveryRecord {
    const record: EditorScriptRecoveryRecord = {
      projectId: input.projectId,
      baseRevision: Math.max(0, Math.floor(input.baseRevision)),
      baseline: cloneScriptDraft(input.baseline),
      draft: cloneScriptDraft(input.draft),
      savedLocallyAt: this.now(),
    }
    const records = readRecoveryMap()
    records[input.projectId] = record
    writeLocal(EDITOR_SCRIPT_RECOVERY_STORAGE_KEY, records)
    return cloneRecord(record)
  }

  remove(projectId: string): void {
    const records = readRecoveryMap()
    if (!Object.prototype.hasOwnProperty.call(records, projectId)) {
      return
    }

    delete records[projectId]
    if (Object.keys(records).length === 0) {
      removeLocal(EDITOR_SCRIPT_RECOVERY_STORAGE_KEY)
      return
    }

    writeLocal(EDITOR_SCRIPT_RECOVERY_STORAGE_KEY, records)
  }
}

export const editorScriptRecoveryRepository = new EditorScriptRecoveryRepository()
