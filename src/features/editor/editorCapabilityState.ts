import { resolveCapability, type CapabilityKey } from '@/features/capabilities/capabilityRegistry'
import type { EditorRouteName } from '@/features/editor/editorRouteGuardState'

const ROUTE_CAPABILITIES: Partial<Record<EditorRouteName, CapabilityKey>> = {
  'editor-script-storyboard': 'editor.script.generated.write',
  'editor-settings': 'editor.setting.write',
  'editor-storyboard': 'editor.storyboard.write',
  'editor-video': 'editor.video.write',
  'editor-dubbing': 'editor.dubbing.write',
  'editor-complete': 'editor.dubbing.write',
}

export type EditorRouteCapabilityResult =
  | { ok: true }
  | {
      ok: false
      capabilityKey: CapabilityKey
      redirectRouteName: 'editor-script-input'
      message: string
    }

export function resolveEditorRouteCapability(routeName: EditorRouteName): EditorRouteCapabilityResult {
  const capabilityKey = ROUTE_CAPABILITIES[routeName]
  if (!capabilityKey) {
    return { ok: true }
  }

  const capability = resolveCapability(capabilityKey)
  if (capability.available) {
    return { ok: true }
  }

  return {
    ok: false,
    capabilityKey,
    redirectRouteName: 'editor-script-input',
    message: capability.message,
  }
}
