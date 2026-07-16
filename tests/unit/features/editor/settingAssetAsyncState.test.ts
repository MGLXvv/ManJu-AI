import { describe, expect, it } from 'vitest'
import { shouldApplySettingAssetAsyncResult } from '@/features/editor/settingAssetAsyncState'

describe('settingAssetAsyncState', () => {
  it('accepts a result for the active project draft', () => {
    expect(
      shouldApplySettingAssetAsyncResult({
        targetProjectId: 'project-1',
        currentProjectId: 'project-1',
        currentDraftProjectId: 'project-1',
      }),
    ).toBe(true)
  })

  it('rejects a result after the route project changes', () => {
    expect(
      shouldApplySettingAssetAsyncResult({
        targetProjectId: 'project-1',
        currentProjectId: 'project-2',
        currentDraftProjectId: 'project-2',
      }),
    ).toBe(false)
  })

  it('rejects a result while another project draft is active', () => {
    expect(
      shouldApplySettingAssetAsyncResult({
        targetProjectId: 'project-1',
        currentProjectId: 'project-1',
        currentDraftProjectId: 'project-2',
      }),
    ).toBe(false)
  })

  it('rejects a result before the target draft is loaded', () => {
    expect(
      shouldApplySettingAssetAsyncResult({
        targetProjectId: 'project-1',
        currentProjectId: 'project-1',
      }),
    ).toBe(false)
  })
})
