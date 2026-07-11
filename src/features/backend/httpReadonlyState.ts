import { resolveCapability, type CapabilityKey } from '@/features/capabilities/capabilityRegistry'

export type HttpReadonlyDomain = 'resource' | 'voice' | 'system'

const DOMAIN_CAPABILITIES: Record<HttpReadonlyDomain, CapabilityKey> = {
  resource: 'resource.write',
  voice: 'voice.write',
  system: 'system.write',
}

export interface HttpReadonlyState {
  readonly: boolean
  message: string
}

export const resolveHttpReadonlyState = (domain: HttpReadonlyDomain): HttpReadonlyState => {
  const capability = resolveCapability(DOMAIN_CAPABILITIES[domain])
  return {
    readonly: !capability.available,
    message: capability.message,
  }
}
