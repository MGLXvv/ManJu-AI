import {
  resolveCapability,
  type CapabilityKey,
  type CapabilityStatus,
} from '@/features/capabilities/capabilityRegistry'
import type { EditorRouteName } from '@/features/editor/editorRouteGuardState'

const ROUTE_CAPABILITIES: Partial<Record<EditorRouteName, CapabilityKey>> = {
  'editor-script-storyboard': 'editor.script.generated.write',
  'editor-settings': 'editor.setting.write',
  'editor-storyboard': 'editor.storyboard.write',
  'editor-video': 'editor.video.write',
  'editor-dubbing': 'editor.dubbing.write',
  'editor-complete': 'editor.dubbing.write',
}

export interface EditorRouteCapabilityViewState {
  routeName: EditorRouteName
  capabilityKey: CapabilityKey | null
  status: CapabilityStatus
  available: boolean
  message: string
}

export type EditorRouteCapabilityResult =
  | { ok: true }
  | {
      ok: false
      capabilityKey: CapabilityKey
      redirectRouteName: 'editor-script-input'
      message: string
    }

export const resolveEditorRouteCapabilityView = (routeName: EditorRouteName): EditorRouteCapabilityViewState => {
  const capabilityKey = ROUTE_CAPABILITIES[routeName]
  if (!capabilityKey) {
    return {
      routeName,
      capabilityKey: null,
      status: 'available',
      available: true,
      message: '',
    }
  }

  const capability = resolveCapability(capabilityKey)
  return {
    routeName,
    capabilityKey,
    status: capability.status,
    available: capability.available,
    message: capability.message,
  }
}

export const buildEditorCapabilityAriaLabel = (label: string, capability: EditorRouteCapabilityViewState): string =>
  capability.available ? label : `${label}，不可用：${capability.message}`

export function resolveEditorRouteCapability(routeName: EditorRouteName): EditorRouteCapabilityResult {
  const capability = resolveEditorRouteCapabilityView(routeName)
  if (capability.available || !capability.capabilityKey) {
    return { ok: true }
  }

  return {
    ok: false,
    capabilityKey: capability.capabilityKey,
    redirectRouteName: 'editor-script-input',
    message: capability.message,
  }
}
