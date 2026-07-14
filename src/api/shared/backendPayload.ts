export type BackendPayloadRecord = Record<string, unknown>

const asRecord = (value: unknown): BackendPayloadRecord | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as BackendPayloadRecord) : null

/**
 * Reads a paginated backend list without leaking response-wrapper differences into pages or stores.
 *
 * The Integration Pack defines `data.list`; legacy frontend adapters historically assumed module-specific
 * wrappers such as `tasks`, `voices` or `templates`. Aliases are accepted only as migration compatibility.
 */
export const extractBackendList = <T>(value: unknown, aliases: readonly string[] = []): T[] => {
  if (Array.isArray(value)) return value as T[]

  const record = asRecord(value)
  if (!record) return []

  for (const key of ['list', ...aliases]) {
    const candidate = record[key]
    if (Array.isArray(candidate)) return candidate as T[]
  }

  return []
}

/**
 * Reads a single entity from either the direct CommonResult `data` value or a legacy named wrapper.
 * Prefer direct entities for new backend contracts; aliases exist to keep older fixtures compatible.
 */
export const extractBackendEntity = <T>(value: unknown, aliases: readonly string[] = []): T | null => {
  if (value === null || value === undefined || Array.isArray(value)) return null

  const record = asRecord(value)
  if (!record) return null

  for (const key of aliases) {
    const candidate = record[key]
    if (candidate !== null && candidate !== undefined && typeof candidate === 'object' && !Array.isArray(candidate)) {
      return candidate as T
    }
  }

  return value as T
}
