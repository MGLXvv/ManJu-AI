import { runtimeConfig } from '@/config/runtimeConfig'

export type CapabilityKey =
  | 'auth.passwordLogin'
  | 'auth.codeLogin'
  | 'auth.register'
  | 'auth.resetPassword'
  | 'auth.thirdPartyLogin'
  | 'resource.read'
  | 'resource.write'
  | 'voice.write'
  | 'system.write'
  | 'project.import'
  | 'project.export'
  | 'generation.cancel'
  | 'generation.retry'
  | 'export.task'
  | 'export.jianying'

export type CapabilityStatus = 'available' | 'mock-only' | 'readonly' | 'unsupported'

interface CapabilityDefinition {
  mock: CapabilityStatus
  http: CapabilityStatus
  message: string
}

export interface CapabilityState {
  key: CapabilityKey
  status: CapabilityStatus
  available: boolean
  message: string
  source: 'default' | 'enabled-override' | 'disabled-override'
}

const DEFINITIONS: Record<CapabilityKey, CapabilityDefinition> = {
  'auth.passwordLogin': {
    mock: 'available',
    http: 'available',
    message: '当前环境暂不支持账号密码登录',
  },
  'auth.codeLogin': {
    mock: 'unsupported',
    http: 'unsupported',
    message: '验证码登录尚未进入当前交付范围',
  },
  'auth.register': {
    mock: 'unsupported',
    http: 'unsupported',
    message: '用户注册尚未进入当前交付范围',
  },
  'auth.resetPassword': {
    mock: 'unsupported',
    http: 'unsupported',
    message: '找回密码尚未进入当前交付范围',
  },
  'auth.thirdPartyLogin': {
    mock: 'unsupported',
    http: 'unsupported',
    message: '第三方登录尚未进入当前交付范围',
  },
  'resource.read': {
    mock: 'available',
    http: 'available',
    message: '当前环境暂不支持读取资源库',
  },
  'resource.write': {
    mock: 'mock-only',
    http: 'readonly',
    message: '当前 HTTP 联调阶段暂不支持资源库新增、编辑或删除',
  },
  'voice.write': {
    mock: 'mock-only',
    http: 'readonly',
    message: '当前 HTTP 联调阶段暂不支持音色新增、编辑或删除',
  },
  'system.write': {
    mock: 'mock-only',
    http: 'readonly',
    message: '当前 HTTP 联调阶段暂不支持系统管理写操作',
  },
  'project.import': {
    mock: 'mock-only',
    http: 'unsupported',
    message: '项目导入接口尚未完成真实联调',
  },
  'project.export': {
    mock: 'mock-only',
    http: 'unsupported',
    message: '项目导出接口尚未完成真实联调',
  },
  'generation.cancel': {
    mock: 'mock-only',
    http: 'unsupported',
    message: '生成任务取消接口尚未完成真实联调',
  },
  'generation.retry': {
    mock: 'mock-only',
    http: 'unsupported',
    message: '生成任务重试接口尚未完成真实联调',
  },
  'export.task': {
    mock: 'unsupported',
    http: 'unsupported',
    message: '项目导出任务接口尚未完成真实联调',
  },
  'export.jianying': {
    mock: 'unsupported',
    http: 'unsupported',
    message: '剪映工程导出规则和接口尚未确认',
  },
}

const enabledOverrides = new Set(runtimeConfig.enabledCapabilities)
const disabledOverrides = new Set(runtimeConfig.disabledCapabilities)

const isUsableStatus = (status: CapabilityStatus): boolean => status === 'available' || status === 'mock-only'

export const resolveCapability = (key: CapabilityKey): CapabilityState => {
  const definition = DEFINITIONS[key]

  if (disabledOverrides.has(key)) {
    return {
      key,
      status: 'unsupported',
      available: false,
      message: `${definition.message}（已被运行配置禁用）`,
      source: 'disabled-override',
    }
  }

  if (enabledOverrides.has(key)) {
    return {
      key,
      status: 'available',
      available: true,
      message: '',
      source: 'enabled-override',
    }
  }

  const status = definition[runtimeConfig.apiMode]
  return {
    key,
    status,
    available: isUsableStatus(status),
    message: isUsableStatus(status) ? '' : definition.message,
    source: 'default',
  }
}

export const canUseCapability = (key: CapabilityKey): boolean => resolveCapability(key).available

export const requireCapability = (key: CapabilityKey): CapabilityState => {
  const state = resolveCapability(key)
  if (!state.available) {
    throw new Error(`CAPABILITY_UNAVAILABLE:${key}:${state.message}`)
  }
  return state
}

export const capabilityRegistry = Object.freeze({
  resolve: resolveCapability,
  canUse: canUseCapability,
  require: requireCapability,
})
