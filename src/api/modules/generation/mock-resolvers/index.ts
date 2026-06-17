import type { GenerationTask } from '../generation.types'
import { resolveScriptMockTask } from './script.mock-resolver'
import { resolveSettingAssetMockTask } from './settingAsset.mock-resolver'
import { resolveStoryboardMockTask } from './storyboard.mock-resolver'
import type { MockGenerationTaskSettlement } from './types'

const resolvers = [resolveScriptMockTask, resolveSettingAssetMockTask, resolveStoryboardMockTask] as const

export const resolveMockGenerationTask = async (
  task: GenerationTask,
): Promise<MockGenerationTaskSettlement | null> => {
  for (const resolver of resolvers) {
    const result = await resolver(task)
    if (result) {
      return result
    }
  }

  return null
}

export type { MockGenerationTaskSettlement } from './types'
