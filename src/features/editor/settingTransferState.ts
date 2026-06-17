import { buildSettingDraftPatch } from '@/features/editor/settingDraftState'
import {
  buildProjectArtifactEnvelope,
  buildProjectArtifactFileName,
  sanitizeProjectArtifactId,
} from '@/features/shared/projectArtifactState'
import type { SettingAsset } from '@/types/settingAsset'

export interface ExportedSettingPayload {
  exportedAt: string
  settingAssets: SettingAsset[]
  characters: { id: string; name: string; description: string }[]
  scenes: { id: string; name: string; description: string }[]
  props: { id: string; name: string; description: string }[]
}

export const buildSettingExportPayload = (assets: SettingAsset[]): ExportedSettingPayload => {
  const patch = buildSettingDraftPatch(assets)
  return {
    exportedAt: new Date().toISOString(),
    settingAssets: patch.settingAssets,
    characters: patch.characters,
    scenes: patch.scenes,
    props: patch.props,
  }
}

export const buildSettingArtifact = (projectId: string, assets: SettingAsset[]) =>
  buildProjectArtifactEnvelope({
    artifact: 'setting',
    projectId: projectId || 'setting',
    payload: buildSettingExportPayload(assets),
  })

export const buildSettingExportFileName = (projectId: string): string => {
  return buildProjectArtifactFileName(projectId || 'setting', 'setting')
}

export const buildSettingBatchExportFileName = (projectId: string): string => {
  const sanitized = sanitizeProjectArtifactId(projectId || 'setting', 'setting')
  return `${sanitized}-setting-batch.json`
}
