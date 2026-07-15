export interface LatestRequestGuard {
  start(): number
  invalidate(): void
  isCurrent(requestId: number): boolean
}

export const createLatestRequestGuard = (): LatestRequestGuard => {
  let currentRequestId = 0

  return {
    start: () => {
      currentRequestId += 1
      return currentRequestId
    },
    invalidate: () => {
      currentRequestId += 1
    },
    isCurrent: (requestId) => requestId === currentRequestId,
  }
}
