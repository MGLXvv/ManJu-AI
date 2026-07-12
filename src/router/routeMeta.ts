import type { RouteMeta } from 'vue-router'

export interface AppRouteMeta {
  requiresAuth?: boolean
  guestOnly?: boolean
  permissionCode?: string
  title?: string
}

type AppRouteLike = {
  meta: RouteMeta
}

const getAppRouteMeta = (route: AppRouteLike): AppRouteMeta => route.meta as AppRouteMeta

export const requiresAuth = (route: AppRouteLike): boolean => Boolean(getAppRouteMeta(route).requiresAuth)

export const isGuestOnly = (route: AppRouteLike): boolean => Boolean(getAppRouteMeta(route).guestOnly)

export const resolveRouteTitle = (route: AppRouteLike, appName = 'ManJu AI'): string => {
  const title = getAppRouteMeta(route).title?.trim()
  return title ? `${title} - ${appName}` : appName
}
