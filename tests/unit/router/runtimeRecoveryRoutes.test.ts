import { describe, expect, it } from 'vitest'
import { resolveRouteTitle } from '@/router/routeMeta'
import { routes } from '@/router/routes'

describe('runtime recovery routes', () => {
  it('registers a project recovery route and a final catch-all route', () => {
    expect(routes.some((route) => route.name === 'project-unavailable')).toBe(true)
    expect(routes.at(-1)).toMatchObject({
      path: '/:pathMatch(.*)*',
      name: 'not-found',
    })
  })

  it('resolves document titles from route metadata', () => {
    expect(resolveRouteTitle({ meta: { title: '页面不存在' } })).toBe('页面不存在 - ManJu AI')
    expect(resolveRouteTitle({ meta: {} })).toBe('ManJu AI')
  })
})
