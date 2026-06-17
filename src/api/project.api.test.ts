import { describe, expect, it } from 'vitest'
import { projectApi } from './project.api'

describe('project api', () => {
  it('creates, updates, exports, and removes a project through backend-ready contracts', async () => {
    const created = await projectApi.create({ name: '测试项目', ratio: '16:9', style: '默认' })
    expect(created.id).toMatch(/^project-/)

    const updated = await projectApi.update({
      id: created.id,
      status: 'completed',
      currentStep: 'complete',
      favorite: true,
    })
    expect(updated).toMatchObject({
      id: created.id,
      status: 'completed',
      currentStep: 'complete',
      favorite: true,
    })

    const exported = await projectApi.exportProject(created.id)
    expect(exported?.id).toBe(created.id)

    await projectApi.remove(created.id)
    await expect(projectApi.getById(created.id)).resolves.toBeNull()
  })

  it('filters projects by case-insensitive keyword and status', async () => {
    const imported = await projectApi.importProjects([
      { name: 'Alpha Story', ratio: '16:9', style: '默认', status: 'in_progress' },
      { name: 'Beta Story', ratio: '9:16', style: '默认', status: 'completed', currentStep: 'complete' },
    ])

    expect(imported).toHaveLength(2)

    const keywordMatches = await projectApi.list({ keyword: 'alpha' })
    expect(keywordMatches.some((project) => project.name === 'Alpha Story')).toBe(true)

    const completed = await projectApi.list({ status: 'completed' })
    expect(completed.every((project) => project.status === 'completed')).toBe(true)
  })
})
