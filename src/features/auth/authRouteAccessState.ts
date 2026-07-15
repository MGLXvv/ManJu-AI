export interface AuthRouteRequirements {
  requiresAuth: boolean
  guestOnly: boolean
}

export interface AuthSessionAccessState {
  isAuthenticated: boolean
  sessionValidated: boolean
}

export type AuthRouteAccessAction = 'allow' | 'login' | 'projects'

export function resolveAuthRouteAccess(
  route: AuthRouteRequirements,
  session: AuthSessionAccessState,
): { action: AuthRouteAccessAction } {
  if (route.requiresAuth && !session.sessionValidated) {
    return { action: 'login' }
  }

  if (route.guestOnly && session.sessionValidated) {
    return { action: 'projects' }
  }

  return { action: 'allow' }
}
