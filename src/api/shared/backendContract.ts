export type BackendEndpointReadiness =
  | 'READY'
  | 'REAL'
  | 'MOCK'
  | 'PARTIAL'
  | 'CONTROLLED_REJECT'
  | 'NO_OP'
  | 'UNKNOWN'

export type FrontendIntegrationEvidence =
  | 'not-started'
  | 'adapter-only'
  | 'fixture-verified'
  | 'live-verified'

export interface BackendEndpointContract {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  readiness: BackendEndpointReadiness
  evidence: FrontendIntegrationEvidence
  source: string
  notes?: string
}

export interface BackendModuleContract {
  module: string
  backendCommit?: string
  endpoints: readonly BackendEndpointContract[]
}

/**
 * Keeps backend documentation metadata next to an HTTP Adapter without coupling runtime requests to the registry.
 * Contract records are review aids: they do not replace DTOs, fixtures, tests or live verification.
 */
export const defineBackendModuleContract = <T extends BackendModuleContract>(contract: T): T => contract
