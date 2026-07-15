export interface RouteLoadingRecord {
  token: number
  startedAt: number
}

export interface RouteLoadingTracker<Target extends object> {
  register(target: Target, record: RouteLoadingRecord): void
  take(target: Target): RouteLoadingRecord | undefined
}

export const createRouteLoadingTracker = <Target extends object>(): RouteLoadingTracker<Target> => {
  const records = new WeakMap<Target, RouteLoadingRecord>()

  return {
    register: (target, record) => records.set(target, record),
    take: (target) => {
      const record = records.get(target)
      records.delete(target)
      return record
    },
  }
}

export const resolveRouteLoadingDelay = ({
  startedAt,
  now,
  minimumMs,
}: {
  startedAt: number
  now: number
  minimumMs: number
}): number => Math.max(0, minimumMs - (now - startedAt))
