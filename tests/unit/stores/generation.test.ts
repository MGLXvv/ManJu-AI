import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { GENERATION_TASK_STATUSES } from '@/types/api-enums'
import { useGenerationStore } from '@/stores/generation'

describe('generation store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('hydrates and creates tasks through the central task layer', async () => {
    const store = useGenerationStore()

    await store.hydrate('project-store-test')
    const created = await store.createTask({ type: 'storyboard', shotId: 'shot-2' })

    expect(created?.status).toBe(GENERATION_TASK_STATUSES.queued)
    expect(created?.requestId).toMatch(/^generation-project-store-test-storyboard-shot-2-/)
    expect(store.projectId).toBe('project-store-test')
    expect(store.tasks.some((task) => task.id === created?.id)).toBe(true)
    expect(store.activeTasks.some((task) => task.id === created?.id)).toBe(true)
  })

  it('allows task creation by explicit project id before hydrate', async () => {
    const store = useGenerationStore()

    const created = await store.createTask({
      projectId: 'project-direct-create',
      type: 'dubbing',
    })

    expect(created?.projectId).toBe('project-direct-create')
    expect(store.projectId).toBe('project-direct-create')
    expect(store.tasks.some((task) => task.id === created?.id)).toBe(true)
  })

  it('updates task status through orchestration helpers', async () => {
    const store = useGenerationStore()

    await store.hydrate('project-store-status')
    const created = await store.createTask({ type: 'video' })
    expect(created).not.toBeNull()

    const running = await store.setTaskStatus(created!.id, GENERATION_TASK_STATUSES.running, 65)
    const cancelled = await store.cancelTask(created!.id)
    const retried = await store.retryTask(created!.id)

    expect(running?.progress).toBe(65)
    expect(cancelled?.status).toBe(GENERATION_TASK_STATUSES.cancelled)
    expect(retried?.status).toBe(GENERATION_TASK_STATUSES.queued)
  })
})
