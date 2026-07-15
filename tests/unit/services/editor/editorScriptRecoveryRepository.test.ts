import { beforeEach, describe, expect, it } from 'vitest'
import { resetLocalState, writeLocal } from '@/api/local'
import { createDefaultEditorDraft } from '@/features/editor/editorDraftDefaults'
import {
  EDITOR_SCRIPT_RECOVERY_STORAGE_KEY,
  EditorScriptRecoveryRepository,
} from '@/services/editor/editorScriptRecoveryRepository'

describe('EditorScriptRecoveryRepository', () => {
  beforeEach(() => {
    resetLocalState()
  })

  it('stores a defensive copy of the script recovery record', () => {
    const repository = new EditorScriptRecoveryRepository(() => '2026-07-15T10:00:00.000Z')
    const baseline = createDefaultEditorDraft('project-recovery')
    const draft = createDefaultEditorDraft('project-recovery')
    draft.script.content = 'local content'

    repository.write({
      projectId: 'project-recovery',
      baseRevision: 2,
      baseline: baseline.script,
      draft: draft.script,
    })
    draft.script.content = 'mutated after write'

    expect(repository.read('project-recovery')).toMatchObject({
      projectId: 'project-recovery',
      baseRevision: 2,
      savedLocallyAt: '2026-07-15T10:00:00.000Z',
      draft: { content: 'local content' },
    })
  })

  it('ignores malformed records and removes valid records explicitly', () => {
    const repository = new EditorScriptRecoveryRepository()
    writeLocal(EDITOR_SCRIPT_RECOVERY_STORAGE_KEY, {
      malformed: { projectId: 'malformed' },
    })

    expect(repository.read('malformed')).toBeNull()

    const draft = createDefaultEditorDraft('valid')
    repository.write({
      projectId: 'valid',
      baseRevision: 0,
      baseline: draft.script,
      draft: { ...draft.script, prompt: 'local prompt' },
    })
    repository.remove('valid')

    expect(repository.read('valid')).toBeNull()
  })
})
