# ManJu-AI 后端运行配置

## 1. 当前 API 模式

前端当前支持：

```dotenv
VITE_API_MODE=mock
VITE_API_MODE=http
```

当前实现位于 `src/api/shared/apiMode.ts`：

```ts
import.meta.env.VITE_API_MODE === 'http' ? 'http' : 'mock'
```

因此当前行为是：

- 变量严格等于 `http` 时使用 HTTP Adapter；
- 变量缺失、拼写错误或使用其他值时回退 Mock。

该回退行为适合早期前端开发，但在联调、测试和生产环境存在“假联调”风险。后续 P1 修复应增加严格运行配置校验。

## 2. 当前 API 基础地址

共享 Axios 客户端位于 `src/api/http.ts`：

```ts
baseURL: import.meta.env.VITE_API_BASE_URL || '/admin-api'
```

规则：

- `VITE_API_BASE_URL` 只包含协议、主机、端口和网关前缀；
- 不应包含 `/aidrama`、`/projects` 等业务路径；
- 未设置时使用同源 `/admin-api`；
- 建议不带结尾 `/`，避免出现双斜杠；
- 业务模块路径必须以 `/` 开头，但不能重复 `/admin-api`。

正确：

```dotenv
VITE_API_BASE_URL=http://localhost:48080/admin-api
```

```ts
http.get('/aidrama/projects')
```

最终请求：

```text
http://localhost:48080/admin-api/aidrama/projects
```

错误：

```dotenv
VITE_API_BASE_URL=http://localhost:48080/admin-api/aidrama
```

```ts
http.get('/admin-api/aidrama/projects')
```

## 3. 推荐环境配置

### 3.1 本地前端 Mock

```dotenv
VITE_API_MODE=mock
```

用途：

- 页面开发；
- Mock 主流程回归；
- 失败状态测试；
- 无后端演示。

### 3.2 本地直连后端

```dotenv
VITE_API_MODE=http
VITE_API_BASE_URL=http://localhost:48080/admin-api
```

### 3.3 Vite 反向代理

```dotenv
VITE_API_MODE=http
```

浏览器请求 `/admin-api/...`，由 Vite 代理到后端。

### 3.4 测试环境

```dotenv
VITE_API_MODE=http
VITE_API_BASE_URL=https://test-api.example.com/admin-api
VITE_STRICT_RUNTIME_CONFIG=true
```

### 3.5 生产同源部署

```dotenv
VITE_API_MODE=http
VITE_STRICT_RUNTIME_CONFIG=true
```

生产网关负责代理 `/admin-api/...`。

`VITE_STRICT_RUNTIME_CONFIG` 是建议新增的目标配置，当前代码尚未实现。实现后测试和生产环境应在配置无效时阻止启动或构建，而不是回退 Mock。

## 4. 建议新增的运行配置层

后续建议新增统一 `runtimeConfig`：

```ts
interface RuntimeConfig {
  apiMode: 'mock' | 'http'
  apiBaseUrl: string
  strict: boolean
  showDebugBanner: boolean
}
```

职责：

- 统一读取和校验环境变量；
- 规范化结尾斜杠；
- 在严格模式拒绝未知 API Mode；
- 在 HTTP 模式检查基础地址；
- 在开发环境显示模式和基础地址；
- 为能力注册表提供运行模式；
- 避免页面直接读取 `import.meta.env`。

建议文件：

```text
src/api/shared/runtimeConfig.ts
src/api/shared/runtimeConfig.test.ts
```

## 5. 推荐 `.env.example`

建议仓库增加：

```dotenv
# mock | http
VITE_API_MODE=mock

# HTTP mode only. Leave empty when using same-origin /admin-api proxy.
VITE_API_BASE_URL=

# Recommended future option. Test and production should enable it.
VITE_STRICT_RUNTIME_CONFIG=false

# Development-only API mode banner.
VITE_SHOW_API_DEBUG=false
```

不得在 `.env.example` 中填写：

- 真实账号和密码；
- Access Token 或 Refresh Token；
- 私有对象存储密钥；
- 生产数据库信息；
- 临时 Tunnel 的固定访问凭证。

## 6. Vite 代理配置要求

当前代理前缀为：

```text
/admin-api
```

后续应避免在通用配置中写死：

- 个人内网 IP；
- 临时 Cloudflare Tunnel 域名；
- 只属于某台机器的端口；
- 单个开发者的允许域名。

推荐通过环境变量提供代理目标：

```dotenv
VITE_DEV_PROXY_TARGET=http://localhost:48080
```

Vite 配置只负责：

```text
/admin-api -> VITE_DEV_PROXY_TARGET
```

如果需要外网临时访问，允许域名也应通过开发环境配置或命令参数提供，不应长期提交临时域名。

## 7. 共享请求行为

当前共享客户端提供：

- 30 秒请求超时；
- 存在 Token 时注入 `Authorization: Bearer <token>`；
- 添加 `X-Requested-With: XMLHttpRequest`；
- 优先解包 `{ code, msg, data }`；
- 非零业务码转换为统一错误；
- HTTP 或业务码 401 清理会话；
- HTTP 或业务码 403 标记无权限。

后续需要确认：

- 30 秒是否只适用于普通请求；
- 生成任务是否只提交而不等待媒体结果；
- 是否使用 Refresh Token；
- 是否使用 HttpOnly Cookie；
- 跨域时是否需要 `withCredentials`；
- 上传和下载是否需要独立客户端；
- 是否需要请求 ID、追踪 ID和幂等键。

长时间图片、视频和配音生成不应依赖延长 Axios 超时解决，应使用异步任务查询。

## 8. 标准化模块

当前具备 Mock/HTTP 入口的模块包括：

- `auth`
- `editor`
- `generation`
- `project`
- `resource`
- `storyboard`
- `voice`
- `setting`
- `system`
- `asset`
- `scriptTemplate`

这些模块的存在只表示前端边界已经预留，不表示真实接口已经联调。实际状态参见 `docs/api-contract-status-matrix.md`。

## 9. 运行配置验收清单

- [ ] `.env.example` 已存在
- [ ] Node 和 pnpm 版本已声明
- [ ] Mock、直连和代理配置均可按文档启动
- [ ] HTTP 模式请求路径不重复 `/admin-api`
- [ ] 测试和生产环境启用严格配置
- [ ] 配置错误不会静默回退 Mock
- [ ] 开发环境可识别当前 API 模式
- [ ] 通用源码不存在固定内网服务器和临时域名
- [ ] 新环境变量有类型声明和单元测试
- [ ] 环境变量修改后文档同步更新

完整接口接入流程参见 `docs/frontend-backend-integration-guide.md`，前端准备修复顺序参见 `docs/frontend-backend-readiness-plan.md`。