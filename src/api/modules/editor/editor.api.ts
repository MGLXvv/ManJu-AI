import { isMockMode } from '@/api/shared/apiMode'
import { editorHttpApi } from './editor.http'
import { editorMockApi } from './editor.mock'

export const editorApi = isMockMode ? editorMockApi : editorHttpApi
