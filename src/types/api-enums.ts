export const API_ERROR_CODES = {
  editorSaveFailed: 'EDITOR_SAVE_FAILED',
  generationTaskNotFound: 'GENERATION_TASK_NOT_FOUND',
  generationTaskFailed: 'GENERATION_TASK_FAILED',
  generationTaskCancelled: 'GENERATION_TASK_CANCELLED',
  generationTaskTimeout: 'GENERATION_TASK_TIMEOUT',
  scriptGenerateFailed: 'SCRIPT_GENERATE_FAILED',
  scriptOptimizeFailed: 'SCRIPT_OPTIMIZE_FAILED',
  settingImageGenerateFailed: 'SETTING_IMAGE_GENERATE_FAILED',
  storyboardGenerateFailed: 'STORYBOARD_GENERATE_FAILED',
  storyboardOptimizeFailed: 'STORYBOARD_OPTIMIZE_FAILED',
  storyboardUpscaleFailed: 'STORYBOARD_UPSCALE_FAILED',
  storyboardUpscaleImageRequired: 'STORYBOARD_UPSCALE_IMAGE_REQUIRED',
  storyboardVideoRequiresPersistedShot: 'STORYBOARD_VIDEO_REQUIRES_PERSISTED_SHOT',
  storyboardVideoImageRequired: 'STORYBOARD_VIDEO_IMAGE_REQUIRED',
  videoGenerateFailed: 'VIDEO_GENERATE_FAILED',
  videoOptimizeFailed: 'VIDEO_OPTIMIZE_FAILED',
  dubbingGenerateFailed: 'DUBBING_GENERATE_FAILED',
} as const

export type KnownApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES]
export type ApiErrorCode = KnownApiErrorCode | (string & {})

export const GENERATION_TASK_TYPES = {
  script: 'script',
  scriptOptimize: 'script_optimize',
  settingAsset: 'setting_asset',
  storyboard: 'storyboard',
  storyboardOptimize: 'storyboard_optimize',
  storyboardUpscale: 'storyboard_upscale',
  video: 'video',
  videoOptimize: 'video_optimize',
  dubbing: 'dubbing',
} as const

export type GenerationTaskType = (typeof GENERATION_TASK_TYPES)[keyof typeof GENERATION_TASK_TYPES]

export const GENERATION_TASK_STATUSES = {
  queued: 'queued',
  running: 'running',
  success: 'success',
  failed: 'failed',
  cancelled: 'cancelled',
} as const

export type GenerationTaskStatus = (typeof GENERATION_TASK_STATUSES)[keyof typeof GENERATION_TASK_STATUSES]

export const EDITOR_SAVE_STATES = {
  idle: 'idle',
  saving: 'saving',
  saved: 'saved',
  error: 'error',
} as const

export type EditorSaveState = (typeof EDITOR_SAVE_STATES)[keyof typeof EDITOR_SAVE_STATES]

export const PROJECT_ARTIFACT_VERSION = 'mock-v1' as const
