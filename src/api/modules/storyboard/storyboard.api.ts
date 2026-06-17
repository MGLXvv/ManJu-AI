import { isMockMode } from '@/api/shared/apiMode'
import { storyboardHttpApi } from './storyboard.http'
import { storyboardMockApi } from './storyboard.mock'

export const storyboardApi = isMockMode ? storyboardMockApi : storyboardHttpApi

export {
  cloneStoryboardShot,
  cloneStoryboardTagOptions,
  createDefaultStoryboardState,
} from './storyboard.mock'
