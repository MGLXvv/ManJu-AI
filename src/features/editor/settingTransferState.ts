import { buildSettingDraftPatch } from '@/features/editor/settingDraftState'
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

export const buildSettingExportFileName = (projectId: string): string => {
  const normalizedProjectId = (projectId || 'setting')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return `${normalizedProjectId || 'setting'}-assets.json`
}
