import { isMockMode } from '@/api/shared/apiMode'

export type HttpReadonlyDomain = 'resource' | 'voice' | 'system' | 'scriptTemplate'

const READONLY_MESSAGES: Record<HttpReadonlyDomain, string> = {
  resource: '当前 HTTP 联调阶段暂不支持资源库新增、编辑或删除',
  voice: '当前 HTTP 联调阶段暂不支持音色新增、编辑或删除',
  system: '当前 HTTP 联调阶段暂不支持系统管理写操作',
  scriptTemplate: '当前 HTTP 联调阶段暂不支持提示词模板新增、编辑或删除',
}

export interface HttpReadonlyState {
  readonly: boolean
  message: string
}

export const resolveHttpReadonlyState = (domain: HttpReadonlyDomain): HttpReadonlyState => {
  if (isMockMode) {
    return {
      readonly: false,
      message: '',
    }
  }

  return {
    readonly: true,
    message: READONLY_MESSAGES[domain],
  }
}
