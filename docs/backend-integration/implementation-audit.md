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

## 本轮已修复

### Auth Profile 与 Session 恢复

- 新增 `GET /system/auth/profile` HTTP 映射；
- 登录后使用 Profile 补全 nickname、roles 和 permissions；
- 应用启动时，HTTP 模式使用已有不透明 Token 请求 Profile；
- Profile 返回 401 并由拦截器清理 Session 后，恢复结果为未登录；
- Mock 模式不调用 Profile，不改变现有 Mock 登录和 E2E 行为；
- 密码、Token 和 Authorization Header 不进入 Fixture 或文档。

### Project 分页与真实 DTO

- 项目列表由错误的 `records` 改为确认的 `list/total`；
- 新增真实项目列表和详情 Fixture；
- `DRAFT` 映射为前端 `in_progress`，缺少工作流步骤时从 `script` 开始；
- 进行中筛选暂时请求 `status=ALL`，再由前端领域状态过滤，避免把 `DRAFT` 项目排除；
- DTO 已补充 description、statusTag、language、latestTaskStatus 和 latestErrorMessage 等真实字段。

以上改动达到 `implemented`，但在 WireGuard 测试环境完成页面刷新、401、创建、更新和删除验收前，不能标记为 `verified`。

## P0：本阶段仍需完成

### Project 创建、更新和删除真实验收

`POST /aidrama/projects` 的请求结构已按后端文档实现，但尚未实际调用。需要创建临时项目并在同一验证流程中完成：

```text
create -> detail -> update name -> delete -> confirm list no longer contains item
```

真实验收后应保存脱敏响应 Fixture，并确认：

- 创建响应是完整项目 DTO 还是仅 ID；
- 更新允许修改的字段和状态枚举；
- 删除后的 HTTP 状态、业务 code 和逻辑删除可见性；
- 是否返回 requestId 或 traceId。

### Project Export / Import compat 路径不匹配

后端 Phase1：

```text
GET  /projects/{projectId}/export
POST /projects/import  // controlled reject
```

当前前端仍保留：

```text
GET  /aidrama/projects/{projectId}/export
POST /aidrama/projects/import
```

Export compat 尚未进入本轮认证与项目主链；Import 能力必须继续关闭。

### Project Asset Adapter 路径和模型不匹配

当前 `asset.http.ts` 使用：

```text
GET /projects/{projectId}/assets
PUT /projects/{projectId}/assets
```

确认契约使用 `/aidrama/projects/{projectId}/assets`，并以单资产 CRUD、workspace/raw、batch-delete 等形式提供，没有“PUT 整个 assets 数组”契约。

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

### 其他列表包裹字段

Project 已通过真实 Fixture 确认为 `list/total`。以下 Adapter 仍假设模块自定义字段：

- Generation：`tasks`；
- Voice：`voices`；
- Script Template：`templates`。

需要用真实响应 Fixture 决定是否统一为 `list/total`，不能凭前端类型继续推断。

## P1：错误处理风险

`editorHttpApi.getDraft()` 捕获 Storyboard Workspace 的所有错误并返回空 `shots`。这会把 401、403、500、契约错误和真实空数据混为一类。HTTP 模式应只对后端明确允许的“尚无分镜”状态做空值映射，其余错误继续抛出。

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

1. 完成 Auth Profile + Project list/detail/create/update/delete 的真实验收；
2. Project overview/statistics/copy/batch-delete；
3. Script Workspace；
4. Storyboard Workspace 与 CRUD；
5. Project Asset 与 Resource Library；
6. Generation Task list/detail/cancel/retry；
7. Voice 与 Script Template；
8. Provider Sandbox 测试工具；
9. Export Mock 契约；
10. 等待真实算法和媒体接口后再进入生产链路。

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
