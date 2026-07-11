# ManJu-AI 后端运行配置

## 1. 配置入口

运行配置统一由 `src/config/runtimeConfig.ts` 读取和校验。页面、Store 和业务 Service 不应直接读取 `import.meta.env`。

当前支持：

```dotenv
VITE_API_MODE=mock
VITE_API_MODE=http
```

`src/api/shared/apiMode.ts` 仅重新导出已经校验后的运行模式：

```ts
export const apiMode = runtimeConfig.apiMode
export const isMockMode = apiMode === 'mock'
```

## 2. 严格模式

严格模式在以下情况启用：

- 生产构建运行时自动启用；
- 显式设置 `VITE_STRICT_RUNTIME_CONFIG=true`；
- Vitest 配置中固定使用显式 Mock 和严格校验。

严格模式下，`VITE_API_MODE` 缺失或不是 `mock/http` 时会抛出：

```text
RUNTIME_CONFIG_INVALID_API_MODE
```

这可以避免测试、联调或生产环境因变量拼写错误而静默进入 Mock。

本地开发未启用严格模式且未配置 API Mode 时，仍默认使用 Mock，便于前端独立开发。

## 3. API 基础地址

共享 Axios 客户端使用：

```ts
baseURL: runtimeConfig.apiBaseUrl
```

配置项：

```dotenv
VITE_API_BASE_URL=http://localhost:48080/admin-api
```

规则：

- 基础地址只包含协议、主机、端口和网关前缀；
- 不包含 `/aidrama`、`/projects` 等业务路径；
- 未设置时使用同源 `/admin-api`；
- 结尾 `/` 会自动移除；
- 业务模块路径以 `/` 开头，但不得重复 `/admin-api`。

示例：

```ts
http.get('/aidrama/projects')
```

最终请求：

```text
http://localhost:48080/admin-api/aidrama/projects
```

## 4. 推荐环境配置

### 4.1 本地 Mock

```dotenv
VITE_API_MODE=mock
VITE_STRICT_RUNTIME_CONFIG=false
```

### 4.2 本地直连后端

```dotenv
VITE_API_MODE=http
VITE_API_BASE_URL=http://localhost:48080/admin-api
VITE_STRICT_RUNTIME_CONFIG=true
```

### 4.3 Vite 反向代理

```dotenv
VITE_API_MODE=http
VITE_STRICT_RUNTIME_CONFIG=true
VITE_DEV_PROXY_TARGET=http://localhost:48080
```

浏览器请求 `/admin-api/...`，Vite 将该前缀代理到 `VITE_DEV_PROXY_TARGET`。

### 4.4 测试环境

```dotenv
VITE_API_MODE=http
VITE_API_BASE_URL=https://test-api.example.com/admin-api
VITE_STRICT_RUNTIME_CONFIG=true
```

### 4.5 生产同源部署

```dotenv
VITE_API_MODE=http
VITE_STRICT_RUNTIME_CONFIG=true
```

生产网关负责代理 `/admin-api/...`。

## 5. 本地开发代理

`vite.config.ts` 不再写死：

- 内网服务器 IP；
- 私有端口；
- 临时 Cloudflare Tunnel 域名；
- 单个开发者的允许域名。

可选配置：

```dotenv
VITE_DEV_PROXY_TARGET=http://127.0.0.1:48080
VITE_DEV_ALLOWED_HOSTS=example.trycloudflare.com,dev.example.com
```

`VITE_DEV_ALLOWED_HOSTS` 使用英文逗号分隔。

## 6. 能力开关

前端能力状态定义在：

```text
src/features/capabilities/capabilityRegistry.ts
```

未确认的 HTTP 能力默认不可用。后端接口完成并经过契约测试后，可以通过环境变量显式启用：

```dotenv
VITE_ENABLED_CAPABILITIES=project.import,project.export,generation.cancel,generation.retry
```

需要对某个部署强制关闭能力时：

```dotenv
VITE_DISABLED_CAPABILITIES=project.export
```

禁用配置优先级高于启用配置。

当前能力键包括：

```text
auth.passwordLogin
auth.codeLogin
auth.register
auth.resetPassword
auth.thirdPartyLogin
resource.read
resource.write
voice.write
system.write
project.import
project.export
generation.cancel
generation.retry
export.task
export.jianying
```

启用某项能力前必须同时满足：

1. HTTP Adapter 已实现；
2. 请求和响应契约已确认；
3. Mapper 和错误处理已完成；
4. 单元测试或契约 Fixture 已覆盖；
5. 联调环境已实际验证。

环境变量只负责开放入口，不能替代接口实现和测试。

## 7. 认证会话

登录 Session 统一由：

```text
src/services/auth/authSessionRepository.ts
```

负责保存、读取和清理。

Mock API 与 HTTP API 只返回 `AuthSession`，不直接操作 Session 存储。Store 对两种模式采用相同处理流程，因此 HTTP 登录成功后刷新页面也能恢复当前 Session。

登录页的记忆选项只保存账号，不保存密码。Mock 账户数据库也不再保存明文密码字段。

后续真实认证仍需要后端确认：

- Access Token 有效期；
- Refresh Token 或 HttpOnly Cookie 方案；
- 刷新 Token 接口；
- 并发 401 刷新锁；
- 后端注销接口；
- 跨域时是否使用 `withCredentials`。

## 8. 工具链版本

仓库当前声明：

```text
Node >= 22.18.0
pnpm >= 10.0.0
packageManager: pnpm@10.12.1
```

同时提供 `.nvmrc`：

```text
22.18.0
```

推荐安装：

```bash
corepack enable
nvm use
pnpm install --frozen-lockfile
```

## 9. `.env.example`

仓库已提供 `.env.example`，其中只记录变量名称和示例，不得写入：

- 真实账号和密码；
- Access Token 或 Refresh Token；
- 私有对象存储密钥；
- 生产数据库信息；
- 私有服务器固定凭证。

## 10. 验收清单

- [x] `.env.example` 已存在；
- [x] Node 和 pnpm 要求已声明；
- [x] API Mode 由统一配置层读取；
- [x] API Base URL 会移除结尾斜杠；
- [x] 测试环境显式使用 Mock 并开启严格模式；
- [x] 生产环境配置错误不会静默回退 Mock；
- [x] Vite 配置不再包含固定内网服务器和临时域名；
- [x] 新环境变量已有 TypeScript 类型声明；
- [x] 运行配置和能力注册表已有单元测试；
- [ ] 在可访问仓库依赖的环境执行 `pnpm test`；
- [ ] 在可访问仓库依赖的环境执行 `pnpm build`。

完整接口接入流程参见 `docs/frontend-backend-integration-guide.md`，接口状态参见 `docs/api-contract-status-matrix.md`。
