# 当前前端实现审计

审计范围：运行配置、Axios 拦截器、Auth、Project、Editor、Resource、System、Voice、Script Template、Generation 与 CapabilityRegistry。

## 已正确实现的基础设施

1. `runtimeConfig.ts` 统一读取 API 模式、Base URL 与能力开关；
2. HTTP Base URL 默认 `/admin-api`，业务 Adapter 追加模块路径；
3. Vite 已支持通过 `VITE_DEV_PROXY_TARGET` 代理 `/admin-api`；
4. 请求拦截器在存在 Token 时发送 Bearer Header；
5. 响应拦截器支持 `{ code, msg, data }`，不会只依据 HTTP 状态判断成功；
6. 业务错误 `code !== 0` 会转成统一 ApiError；
7. 401 会清理会话，403 会进入无权限状态；
8. 页面和 Store 基本通过 API Contract/Service 访问后端；
9. Mock 与 HTTP 模式仍然隔离，能力开关可阻止未验证写操作。

## P0：开始真实联调前必须修复

### Project 分页响应不匹配

当前：

```ts
http.get<{ records?: BackendProjectDTO[] }>("/aidrama/projects");
return data.records ?? [];
```

确认契约：

```json
{
  "list": [],
  "total": 0
}
```

影响：HTTP 模式项目列表可能始终为空，即使请求成功。

### Project Export / Import compat 路径不匹配

后端 Phase1：

```text
GET  /projects/{projectId}/export
POST /projects/import  // controlled reject
```

当前前端：

```text
GET  /aidrama/projects/{projectId}/export
POST /aidrama/projects/import
```

影响：Export compat 可能 404；Import 不应尝试真实调用。

### Project Asset Adapter 路径和模型不匹配

当前 `asset.http.ts` 使用：

```text
GET /projects/{projectId}/assets
PUT /projects/{projectId}/assets
```

确认契约使用 `/aidrama/projects/{projectId}/assets`，并以单资产 CRUD、workspace/raw、batch-delete 等形式提供，没有“PUT 整个 assets 数组”契约。

### Auth Profile 未接入

登录已实现，但没有使用 `GET /system/auth/profile` 验证服务端 Session。当前刷新恢复主要依赖本地会话；后端重启后 Token 失效时，需要等待下一次业务请求触发 401。

## P1：后端已 READY，但前端仍关闭或只读

- Resource Library CRUD；
- 保存项目资产到资源库；
- 从资源库导入到项目；
- Voice CRUD；
- Script Template CRUD 的真实响应映射验证；
- Generation Task cancel/retry；
- 项目 copy、batch-delete、statistics、overview、tasks、pipeline；
- Auth send-code、code-login、register、reset-password。

这些能力不能只通过 `VITE_ENABLED_CAPABILITIES` 强制打开。应先修正 DTO、Mapper 和契约测试，再更新 CapabilityRegistry 默认状态。

## P1：明确 Mapper 风险

### Resource 类型

当前非 `CHARACTER` 都映射为 `scene`，会把 `PROP` 错误归类。

### Resource scope

当前判断 `OFFICIAL`，后端确认枚举为：

```text
PRIVATE / SYSTEM / SHARED
```

### 列表包裹字段

以下 Adapter 假设模块自定义字段，但后端通用分页说明为 `list/total`：

- Project：`records`；
- Generation：`tasks`；
- Voice：`voices`；
- Script Template：`templates`。

需要用真实响应 Fixture 决定是否统一为 `list/total`，不能凭前端类型继续推断。

## P1：错误处理风险

`editorHttpApi.getDraft()` 捕获 Storyboard Workspace 的所有错误并返回空 `shots`。这不是切换 Mock，但会把 401、403、500、契约错误和真实空数据混为一类。HTTP 模式应只对后端明确允许的“尚无分镜”状态做空值映射，其余错误继续抛出。

System NO_OP 接口可能返回 `data=null`。当前 `markMessageRead`、`markAllRead` 直接读取 `data.message` / `data.messages`，需要加空值保护。

## P2：阶段内合理保留的限制

以下状态与后端文档一致，无需在本轮强行实现：

- Generation Task 通用 create/update 保持受控拒绝；
- System styles/permissions 写操作保持不可用；
- 项目 Import 保持不可用；
- Provider Callback 不由普通前端调用；
- 真实 Image2、Video、TTS 与 Export 保持 blocked；
- 不实现猜测性的 Refresh Token 自动换新。

## 推荐实施顺序

1. Auth Profile + Project list/detail/create/update/delete；
2. 修正分页 Mapper、路径和 Fixture；
3. Project overview/statistics/copy/batch-delete；
4. Script Workspace；
5. Storyboard Workspace 与 CRUD；
6. Project Asset 与 Resource Library；
7. Generation Task list/detail/cancel/retry；
8. Voice 与 Script Template；
9. Provider Sandbox 测试工具；
10. Export Mock 契约；
11. 等待真实算法和媒体接口后再进入生产链路。

## 验证要求

每个模块由 `partial` 升级为 `verified` 前必须覆盖：

- 成功响应；
- 业务 `code=400`；
- 401；
- 403；
- 404/空数据；
- 页面刷新恢复；
- DTO 空值和枚举；
- Mock 模式回归；
- 不打印 Token、密码和敏感请求头。
