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
    message: '验证码登录后端接口已存在，但前端页面与真实验证码链路尚未接入',
  },
  'auth.register': {
    mock: 'unsupported',
    http: 'unsupported',
    message: '注册接口已存在，但不在当前前端交付范围',
  },
  'auth.resetPassword': {
    mock: 'unsupported',
    http: 'unsupported',
    message: '重置密码接口已存在，但不在当前前端交付范围',
  },
  'auth.thirdPartyLogin': {
    mock: 'unsupported',
    http: 'unsupported',
    message: '第三方平台尚未完成真实联调',
  },
  'resource.read': {
    mock: 'available',
    http: 'available',
    message: '当前环境暂不支持读取资源库',
  },
  'resource.write': {
    mock: 'mock-only',
    http: 'available',
    message: '当前环境暂不支持资源库新增、编辑或删除',
  },
  'voice.write': {
    mock: 'mock-only',
    http: 'available',
    message: '当前环境暂不支持音色目录新增、编辑或删除',
  },
  'system.write': {
    mock: 'mock-only',
    http: 'readonly',
    message: 'Phase1 系统样式和权限写接口为受控拒绝',
  },
  'project.import': {
    mock: 'mock-only',
    http: 'unsupported',
    message: 'Phase1 项目导入接口为受控拒绝',
  },
  'project.export': {
    mock: 'mock-only',
    http: 'unsupported',
    message: '当前项目 JSON 导出契约与后端导出任务语义不一致',
  },
  'generation.cancel': {
    mock: 'mock-only',
    http: 'available',
    message: '当前环境暂不支持取消生成任务',
  },
  'generation.retry': {
    mock: 'mock-only',
    http: 'available',
    message: '当前环境暂不支持重试生成任务',
  },
  'export.task': {
    mock: 'unsupported',
    http: 'unsupported',
    message: '当前导出接口只提供 Mock 任务和占位下载地址',
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
