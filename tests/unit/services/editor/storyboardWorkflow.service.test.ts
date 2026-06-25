import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/api/http'
import type { StoryboardShot } from '@/types/storyboard'

vi.mock('@/api/http', () => ({
  http: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const buildShot = (overrides: Partial<StoryboardShot> = {}): StoryboardShot => ({
  id: 'shot-1',
  index: 1,
  title: '镜头 1',
  prompt: '默认提示词',
  characters: [],
  scenes: [],
  props: [],
  style: '写实',
  ratio: '16:9',
  status: 'pending-review',
  referenceImages: [],
  createdAt: '2026-06-25T00:00:00.000Z',
  ...overrides,
})

describe('storyboardWorkflowService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('does nothing in mock mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'mock',
      isMockMode: true,
    }))

    const { storyboardWorkflowService } = await import('@/services/editor/storyboardWorkflow.service')

    await storyboardWorkflowService.confirmStoryboard('project-1')

    expect(http.post).not.toHaveBeenCalled()
  })

  it('confirms storyboard through backend endpoint in http mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    vi.mocked(http.post).mockResolvedValue({ data: undefined })

    const { storyboardWorkflowService } = await import('@/services/editor/storyboardWorkflow.service')

    await storyboardWorkflowService.confirmStoryboard('project-1')

    expect(http.post).toHaveBeenCalledWith('/aidrama/projects/project-1/storyboard/confirm')
  })

  it('generates storyboard through backend endpoint in http mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    vi.mocked(http.post).mockResolvedValue({
      data: {
        storyboards: [{ id: 1, sort: 1, content: '镜头一' }],
      },
    })

    const { storyboardWorkflowService } = await import('@/services/editor/storyboardWorkflow.service')

    const patch = await storyboardWorkflowService.generateStoryboard('project-1')

    expect(http.post).toHaveBeenCalledWith('/aidrama/projects/project-1/storyboard/generate')
    expect(patch?.shots).toHaveLength(1)
    expect(patch?.shots[0].id).toBe('1')
  })

  it('falls back to workspace when generate returns no shots', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    vi.mocked(http.post).mockResolvedValue({ data: { storyboards: [] } })
    vi.mocked(http.get).mockResolvedValue({
      data: {
        storyboards: [{ id: 2, sort: 2, content: '回退镜头' }],
      },
    })

    const { storyboardWorkflowService } = await import('@/services/editor/storyboardWorkflow.service')

    const patch = await storyboardWorkflowService.generateStoryboard('project-1')

    expect(http.get).toHaveBeenCalledWith('/aidrama/projects/project-1/storyboard/workspace')
    expect(patch?.shots[0].id).toBe('2')
  })

  it('creates local shots and refreshes workspace in http mode', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    vi.mocked(http.post).mockResolvedValueOnce({ data: { id: 101 } })
    vi.mocked(http.get).mockResolvedValue({
      data: {
        storyboards: [{ id: 101, sort: 1, content: '已创建镜头' }],
      },
    })

    const { storyboardWorkflowService } = await import('@/services/editor/storyboardWorkflow.service')

    const patch = await storyboardWorkflowService.syncStoryboards('project-1', {
      currentShots: [buildShot({ id: 'shot-1', prompt: '已创建镜头' })],
      persistedIds: [],
    })

    expect(http.post).toHaveBeenCalledWith(
      '/aidrama/projects/project-1/storyboards',
      expect.objectContaining({ content: '已创建镜头' }),
    )
    expect(http.get).toHaveBeenCalledWith('/aidrama/projects/project-1/storyboard/workspace')
    expect(patch?.shots[0].id).toBe('101')
  })

  it('updates persisted shots and deletes removed ones before refreshing workspace', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'http',
      isMockMode: false,
    }))

    vi.mocked(http.put).mockResolvedValue({ data: undefined })
    vi.mocked(http.delete).mockResolvedValue({ data: undefined })
    vi.mocked(http.get).mockResolvedValue({
      data: {
        storyboards: [{ id: 12, sort: 1, content: '更新后的镜头' }],
      },
    })

    const { storyboardWorkflowService } = await import('@/services/editor/storyboardWorkflow.service')

    await storyboardWorkflowService.syncStoryboards('project-1', {
      currentShots: [buildShot({ id: '12', prompt: '更新后的镜头' })],
      persistedIds: ['12', '13'],
    })

    expect(http.put).toHaveBeenCalledWith(
      '/aidrama/projects/project-1/storyboards/12',
      expect.objectContaining({ content: '更新后的镜头' }),
    )
    expect(http.delete).toHaveBeenCalledWith('/aidrama/projects/project-1/storyboards/13')
  })

  it('returns null in mock mode without calling backend CRUD', async () => {
    vi.doMock('@/api/shared/apiMode', () => ({
      apiMode: 'mock',
      isMockMode: true,
    }))

    const { storyboardWorkflowService } = await import('@/services/editor/storyboardWorkflow.service')

    const patch = await storyboardWorkflowService.syncStoryboards('project-1', {
      currentShots: [],
      persistedIds: ['12'],
    })

    expect(patch).toBeNull()
    expect(http.post).not.toHaveBeenCalled()
    expect(http.put).not.toHaveBeenCalled()
    expect(http.delete).not.toHaveBeenCalled()
  })
})
