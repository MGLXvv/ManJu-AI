import type { GenerationTask } from '@/types/generation'

const wait = (timeoutMs: number): Promise<void> =>
  new Promise((resolve) => {
    globalThis.setTimeout(resolve, timeoutMs)
  })

export const pollTaskUntilSettled = async (
  taskId: string,
  getTask: (id: string) => Promise<GenerationTask | null>,
  intervalMs = 800,
): Promise<GenerationTask | null> => {
  let current = await getTask(taskId)

  while (current && (current.status === 'queued' || current.status === 'running')) {
    await wait(intervalMs)
    current = await getTask(taskId)
  }

  return current
}
