import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()
const put = vi.fn()
const del = vi.fn()

vi.mock('@/api/http', () => ({
  http: {
    get,
    post,
    put,
    delete: del,
  },
}))

describe('projectHttpApi', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    put.mockReset()
    del.mockReset()
    vi.resetModules()
  })

  it('maps list query and normalizes backend project list', async () => {
    get.mockResolvedValue({
      data: {
        records: [
          {
            id: 1,
            name: 'Alpha',
            status: 'IN_PROGRESS',
            aspectRatio: '16:9',
            createTime: '2026-06-24 10:00:00',
          },
        ],
      },
    })

    const { projectHttpApi } = await import('@/api/modules/project/project.http')
    const projects = await projectHttpApi.list({ page: 3, pageSize: 15, status: 'all', keyword: 'Alpha' })

    expect(get).toHaveBeenCalledWith('/aidrama/projects', {
      params: {
        pageNo: 3,
        pageSize: 15,
        status: 'ALL',
        keyword: 'Alpha',
      },
    })
    expect(projects[0]).toMatchObject({ id: '1', name: 'Alpha', status: 'in_progress' })
  })

  it('fetches detail by backend route and maps the project dto', async () => {
    get.mockResolvedValue({
      data: {
        id: 9,
        name: 'Detail Demo',
        status: 'COMPLETED',
      },
    })

    const { projectHttpApi } = await import('@/api/modules/project/project.http')
    const project = await projectHttpApi.getById('9')

    expect(get).toHaveBeenCalledWith('/aidrama/projects/9')
    expect(project).toMatchObject({ id: '9', status: 'completed', currentStep: 'complete' })
  })

  it('maps create input to backend payload and normalizes response', async () => {
    post.mockResolvedValue({
      data: {
        id: 5,
        name: 'Created Demo',
        status: 'IN_PROGRESS',
        aspectRatio: '9:16',
        createTime: '2026-06-24 12:00:00',
      },
    })

    const { projectHttpApi } = await import('@/api/modules/project/project.http')
    const created = await projectHttpApi.create({ name: 'Created Demo', ratio: '9:16', style: '' })

    expect(post).toHaveBeenCalledWith('/aidrama/projects', {
      name: 'Created Demo',
      description: '',
      aspectRatio: '9:16',
      style: 'anime',
      language: 'zh-CN',
      durationSeconds: 60,
    })
    expect(created).toMatchObject({ id: '5', ratio: '9:16' })
  })

  it('falls back to getById when update has no backend-supported fields', async () => {
    get.mockResolvedValue({
      data: {
        id: 7,
        name: 'Fallback Demo',
        status: 'IN_PROGRESS',
        createTime: '2026-06-24 08:00:00',
      },
    })

    const { projectHttpApi } = await import('@/api/modules/project/project.http')
    const updated = await projectHttpApi.update({
      id: '7',
      currentStep: 'video',
      favorite: true,
    })

    expect(put).not.toHaveBeenCalled()
    expect(get).toHaveBeenCalledWith('/aidrama/projects/7')
    expect(updated).toMatchObject({ id: '7', name: 'Fallback Demo' })
  })

  it('updates by backend route when supported fields are present', async () => {
    put.mockResolvedValue({
      data: {
        id: 8,
        name: 'Renamed',
        status: 'COMPLETED',
      },
    })

    const { projectHttpApi } = await import('@/api/modules/project/project.http')
    const updated = await projectHttpApi.update({
      id: '8',
      name: 'Renamed',
      status: 'completed',
    })

    expect(put).toHaveBeenCalledWith('/aidrama/projects/8', {
      name: 'Renamed',
      status: 'COMPLETED',
    })
    expect(updated).toMatchObject({ id: '8', status: 'completed' })
  })

  it('uses the backend export alias route in http mode', async () => {
    get.mockResolvedValue({
      data: {
        id: 3,
        name: 'Export Demo',
        status: 'IN_PROGRESS',
        createTime: '2026-06-24 07:00:00',
      },
    })

    const { projectHttpApi } = await import('@/api/modules/project/project.http')

    const exported = await projectHttpApi.exportProject('3')
    expect(get).toHaveBeenCalledWith('/projects/3/export')
    expect(exported).toMatchObject({ id: '3', name: 'Export Demo' })
  })

  it('posts project imports through the backend compat route', async () => {
    post.mockResolvedValue({
      data: {
        projects: [
          {
            id: 12,
            name: 'Imported Demo',
            status: 'IN_PROGRESS',
            aspectRatio: '16:9',
            createTime: '2026-06-24 09:00:00',
          },
        ],
      },
    })

    const { projectHttpApi } = await import('@/api/modules/project/project.http')
    const imported = await projectHttpApi.importProjects([
      {
        name: 'Imported Demo',
        ratio: '16:9',
        style: 'anime',
      },
    ])

    expect(post).toHaveBeenCalledWith('/projects/import', [
      {
        name: 'Imported Demo',
        ratio: '16:9',
        style: 'anime',
      },
    ])
    expect(imported).toMatchObject([{ id: '12', name: 'Imported Demo' }])
  })

  it('deletes by backend route', async () => {
    del.mockResolvedValue({})

    const { projectHttpApi } = await import('@/api/modules/project/project.http')
    await projectHttpApi.remove('11')

    expect(del).toHaveBeenCalledWith('/aidrama/projects/11')
  })
})