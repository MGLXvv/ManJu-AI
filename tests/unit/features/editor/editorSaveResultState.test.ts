import { describe, expect, it } from 'vitest'
import { shouldApplyEditorSaveResult } from '@/features/editor/editorSaveResultState'

describe('editorSaveResultState', () => {
  it('accepts a save result for the active project draft', () => {
    expect(
      shouldApplyEditorSaveResult({
        targetProjectId: 'project-1',
        currentProjectId: 'project-1',
        currentDraftProjectId: 'project-1',
      }),
    ).toBe(true)
  })

  it('rejects a save result after the active project changes', () => {
    expect(
      shouldApplyEditorSaveResult({
        targetProjectId: 'project-1',
        currentProjectId: 'project-2',
        currentDraftProjectId: 'project-2',
      }),
    ).toBe(false)
  })

  it('rejects a save result while another draft is active', () => {
    expect(
      shouldApplyEditorSaveResult({
        targetProjectId: 'project-1',
        currentProjectId: 'project-1',
        currentDraftProjectId: 'project-2',
      }),
    ).toBe(false)
  })
})
