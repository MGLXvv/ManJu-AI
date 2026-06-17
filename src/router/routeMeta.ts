export interface AppRouteMeta {
  requiresAuth?: boolean
  guestOnly?: boolean
  permissionCode?: string
}

export const requiresAuth = (route: { meta?: AppRouteMeta }): boolean => Boolean(route.meta?.requiresAuth)

export const isGuestOnly = (route: { meta?: AppRouteMeta }): boolean => Boolean(route.meta?.guestOnly)
