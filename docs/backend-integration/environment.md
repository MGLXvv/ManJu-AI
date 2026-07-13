# 联调环境规格

## 测试环境

| 项目           | 值                                      |
| -------------- | --------------------------------------- |
| 后端 Base URL  | `http://10.10.3.26:48080`               |
| Health         | `GET /admin-api/health`                 |
| API 前缀       | `/admin-api`                            |
| 网络入口       | WireGuard 内网 IP + Spring Boot 端口    |
| Nginx 正式入口 | 尚未配置                                |
| Provider 模式  | Image、Video、TTS 当前为 Mock/Readiness |

## 启动前检查

```powershell
Test-NetConnection 10.10.3.26 -Port 48080
```

Health 验收：

```text
HTTP 200
response.code === 0
response.data.status === "UP"
```

端口或 Health 不通时先检查 WireGuard、Java 服务和监听端口，不应先修改前端接口路径。

## 浏览器代理

后端当前没有全局 CORS 配置。本地开发必须优先通过 Vite 代理访问：

```text
/admin-api -> http://10.10.3.26:48080
```

推荐环境变量：

```dotenv
VITE_API_MODE=http
VITE_API_BASE_URL=/admin-api
VITE_DEV_PROXY_TARGET=http://10.10.3.26:48080
VITE_STRICT_RUNTIME_CONFIG=true
```

前端业务代码只请求 `/admin-api` 下的相对路径，不允许在组件、Store 或业务服务中硬编码 `10.10.3.26:48080`。

当前 `vite.config.ts` 已支持使用 `VITE_DEV_PROXY_TARGET` 为 `/admin-api` 建立代理；`runtimeConfig.ts` 默认 API Base URL 也是 `/admin-api`。

## 鉴权

登录接口：

```http
POST /admin-api/system/auth/login
Content-Type: application/json
```

除登录、短信认证和公开 Health 外，管理端接口需要：

```http
Authorization: Bearer <accessToken>
```

当前 Token：

- 是 `dev-token-*` 形式的不透明内存 Session Token；
- 不是 JWT，前端禁止解析；
- 后端重启后失效；
- 虽然登录响应包含 `refreshToken`，但当前没有换新接口；
- 前端不得实现猜测性的自动刷新；
- 密码、Token、Cookie、API Key 不得进入控制台、埋点、错误报告或 Fixture。

## 配置职责

| 层              | 责任                                           |
| --------------- | ---------------------------------------------- |
| 页面/Store      | 只调用领域 API 或 Service，不拼接网关路径      |
| HTTP Adapter    | 拼接模块路径，如 `/aidrama/projects`           |
| `runtimeConfig` | 提供 `/admin-api` 基础前缀                     |
| Vite Proxy      | 本地把 `/admin-api` 转发到测试服务器           |
| Nginx           | 正式环境统一域名、HTTPS 与反向代理，当前未配置 |
| 后端            | Spring Boot Controller、鉴权和业务响应         |

禁止同时把 `VITE_API_BASE_URL` 配成包含 `/admin-api` 的绝对地址，又在代理或模块中重复添加 `/admin-api`。
