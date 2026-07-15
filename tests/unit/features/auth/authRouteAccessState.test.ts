import { describe, expect, it } from 'vitest'
import { resolveAuthRouteAccess } from '@/features/auth/authRouteAccessState'

describe('authRouteAccessState', () => {
  it('redirects protected routes when no session exists', () => {
    expect(
      resolveAuthRouteAccess(
        { requiresAuth: true, guestOnly: false },
        { isAuthenticated: false, sessionValidated: false },
      ),
    ).toEqual({ action: 'login' })
  })

  it('redirects protected routes when a token has not been validated', () => {
    expect(
      resolveAuthRouteAccess(
        { requiresAuth: true, guestOnly: false },
        { isAuthenticated: true, sessionValidated: false },
      ),
    ).toEqual({ action: 'login' })
  })

  it('allows protected routes only after session validation', () => {
    expect(
      resolveAuthRouteAccess(
        { requiresAuth: true, guestOnly: false },
        { isAuthenticated: true, sessionValidated: true },
      ),
    ).toEqual({ action: 'allow' })
  })

  it('keeps login reachable for an unvalidated token and redirects a validated session', () => {
    expect(
      resolveAuthRouteAccess(
        { requiresAuth: false, guestOnly: true },
        { isAuthenticated: true, sessionValidated: false },
      ),
    ).toEqual({ action: 'allow' })

    expect(
      resolveAuthRouteAccess(
        { requiresAuth: false, guestOnly: true },
        { isAuthenticated: true, sessionValidated: true },
      ),
    ).toEqual({ action: 'projects' })
  })
})
