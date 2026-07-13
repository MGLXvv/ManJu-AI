import { beforeEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/api/http'
import { authHttpApi } from '@/api/modules/auth/auth.http'
import { editorHttpApi } from '@/api/modules/editor/editor.http'
import { generationHttpApi } from '@/api/modules/generation/generation.http'
import { projectHttpApi } from '@/api/modules/project/project.http'
import authLoginFixture from '../../fixtures/http/auth-login.success.json'
import authProfileFixture from '../../fixtures/http/auth-profile.success.json'
import editorWorkspaceFixture from '../../fixtures/http/editor-workspace.success.json'
import generationListFixture from '../../fixtures/http/generation-list.success.json'
import projectDetailFixture from '../../fixtures/http/project-detail.success.json'
import projectListFixture from '../../fixtures/http/project-list.success.json'

vi.mock('@/api/http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('HTTP adapter contract fixtures', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps the authentication login fixture into an AuthSession', async () => {
    vi.mocked(http.post).mockResolvedValue({ data: authLoginFixture })

    const session = await authHttpApi.loginByPassword({
      account: 'fixture-account',
      password: 'fixture-password',
    })

    expect(http.post).toHaveBeenCalledWith('/system/auth/login', {
      username: 'fixture-account',
      password: 'fixture-password',
    })
    expect(session).toEqual({
      token: 'fixture-access-token',
      user: {
        id: '42',
        name: 'fixture-user',
        username: 'fixture-user',
      },
    })
  })

  it('maps the real profile fixture into roles and permissions', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: authProfileFixture })

    const profile = await authHttpApi.getProfile?.()

    expect(http.get).toHaveBeenCalledWith('/system/auth/profile')
    expect(profile).toEqual({
      id: '1',
      name: 'Admin',
      username: 'admin',
      nickname: 'Admin',
      roles: ['super_admin'],
      permissions: [
        'system:menu:read',
        'aidrama:project:read',
        'aidrama:project:write',
        'aidrama:storyboard:read',
        'aidrama:task:read',
      ],
    })
  })

  it('maps the real project list fixture into frontend project fields', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: projectListFixture })

    const projects = await projectHttpApi.list({
      page: 1,
      pageSize: 20,
      status: 'all',
    })

    expect(http.get).toHaveBeenCalledWith('/aidrama/projects', {
      params: {
        pageNo: 1,
        pageSize: 20,
        keyword: undefined,
        status: 'ALL',
      },
    })
    expect(projects).toEqual([
      expect.objectContaining({
        id: '18',
        name: 'ss',
        status: 'in_progress',
        currentStep: 'script',
        ratio: '9:16',
        style: '电影感',
        duration: '60s',
        updatedAt: '2026-07-04T07:52:49',
      }),
    ])
  })

  it('maps the real project detail fixture without inventing workflow state', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: projectDetailFixture })

    const project = await projectHttpApi.getById('18')

    expect(http.get).toHaveBeenCalledWith('/aidrama/projects/18')
    expect(project).toMatchObject({
      id: '18',
      name: 'ss',
      status: 'in_progress',
      currentStep: 'script',
      ratio: '9:16',
      style: '电影感',
      duration: '60s',
    })
  })

  it('combines script and storyboard workspace fixtures into an EditorDraft', async () => {
    vi.mocked(http.get)
      .mockResolvedValueOnce({ data: editorWorkspaceFixture.scriptWorkspace })
      .mockResolvedValueOnce({ data: editorWorkspaceFixture.storyboardWorkspace })

    const draft = await editorHttpApi.getDraft('project-7')

    expect(http.get).toHaveBeenNthCalledWith(1, '/aidrama/projects/project-7/script/workspace')
    expect(http.get).toHaveBeenNthCalledWith(2, '/aidrama/projects/project-7/storyboard/workspace')
    expect(draft).toMatchObject({
      projectId: 'project-7',
      script: {
        content: 'Fixture source text',
        prompt: 'Fixture prompt',
        generated: 'Fixture generated script',
      },
      shots: [
        {
          id: '101',
          title: 'Fixture Shot',
          description: 'Fixture character enters the scene',
          durationSeconds: 8,
        },
      ],
    })
  })

  it('keeps the generation task fixture compatible with the task gateway domain model', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: generationListFixture })

    const tasks = await generationHttpApi.list('project-7')

    expect(http.get).toHaveBeenCalledWith('/generation/tasks', {
      params: { projectId: 'project-7' },
    })
    expect(tasks).toEqual([
      expect.objectContaining({
        id: 'task-1',
        projectId: 'project-7',
        shotId: 'shot-101',
        requestId: 'request-1',
        type: 'video',
        status: 'running',
        progress: 42,
      }),
    ])
  })
})
