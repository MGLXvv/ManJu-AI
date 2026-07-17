# 当前前端接入准备度审计

## 总体结论

当前前端已经具备“后端到位后只修改适配层”的基础框架，不需要重新设计页面或 Store。

后续工作应集中在：

```text
HTTP Adapter
Backend DTO
Mapper
Fixture
Capability 状态
契约测试
真实环境验收
```

当前不应继续：

- 根据响应字段猜测请求字段；
- 把后端文档中的 READY 直接标记为 verified；
- 把 Mock resultUrl 当作真实媒体；
- 把 HTTP 200 或 `code=0` 当作业务副作用已经发生；
- 在页面和 Store 中加入后端兼容判断；
- 在后端失败时静默切回 Mock。

## 已完成的框架

### 运行配置与 HTTP Client

- `runtimeConfig.ts` 统一读取 API 模式、Base URL 和 Capability 覆盖；
- HTTP 默认基础路径为 `/admin-api`；
- Vite 支持本地代理；
- 请求统一添加 Bearer Token；
- 响应统一兼容 `{ code, msg, data }`；
- 业务错误转换为 ApiError；
- 401 清理或过期 Session，403 保留 Session。

### 模块化 Adapter

标准目录已经形成：

```text
<module>.api.ts
<module>.http.ts
<module>.mock.ts
<module>.types.ts
<module>.mapper.ts
```

页面、组件和 Store 基本通过 Contract 或 Domain Service 调用。

### CapabilityRegistry

未验证能力可以标记为：

```text
available
mock-only
readonly
unsupported
```

Project Import、Export Task、Resource Write、Voice Write、System Write、Generation cancel/retry 等已有统一保护。

### 编辑器持久化边界

- `EditorPersistenceService` 已存在；
- 草稿分为 Script、Setting、Storyboard、Video、Dubbing、ProjectMeta；
- HTTP Adapter 按显式分区加载；
- 未实现分区不再返回默认数据或假装保存成功；
- Storyboard Workspace 错误不再被吞掉；
- revision/version 只采用后端真实返回值；
- Script Content 请求 DTO 未确认时显式阻断。

### 生成任务、媒体和测试

- GenerationTaskGateway 和任务状态抽象已存在；
- 通用 create/update 已按 Phase1 稳定拒绝处理；
- 文件上传和生成结果已有前端抽象；
- HTTP Adapter 单元测试、脱敏 Fixture、Mock E2E、长会话、视觉回归、Windows 质量脚本和 Build Budget 已建立。

## 已完成的真实证据

### Auth

已完成登录、Profile、角色权限映射、持久化 Token 恢复和失效 Token 401。

仍缺低权限 403、后端 Logout、生产 Session 和 Refresh。

### Project

已完成 `list/total`、详情、创建、重命名、删除和删除后列表校验；验证脚本支持失败自动清理。

仍缺页面级完整验收、扩展端点、完整 update DTO、删除后详情行为和低权限 403。

### Script Draft

已确认 Workspace GET 和 Draft PUT 的 `rawText/prompt` 保存与回读。

明确未确认：

- Script Content PUT 请求 DTO；
- Confirm 前置条件；
- revision/version 和 409；
- 剧本分镜文本的独立持久化字段。

真实探测证明 `{ content }` 返回 `code=0`，但 Workspace 的 `scriptContent` 仍为空。不能继续根据响应字段反推 `{ scriptContent }`。

## 当前主要风险

### P0：状态语义混乱

历史文档同时使用 READY、implemented、partial、verified。现统一使用 endpoint-matrix 的证据状态；`verified` 只保留给完整真实验收。

### P0：猜测性 DTO

高风险位置包括 Script Content、Voice/Template/Generation 分页、Project Asset 路径和保存模型、Resource scope/type、revision/version 和 409。

未确认接口必须显式阻断，后端提供 OpenAPI、DTO 或 Fixture 后只修改 Adapter 和 Mapper。

### P0：Mock 被误认为真实能力

Script Generate、Storyboard Generate、Provider Sandbox 和 Export 均包含 Mock 或占位行为。它们应标记为 `mock-only`，占位 resultUrl 不进入永久媒体模型。

### P1：Asset、Resource 与媒体

Project Asset 路径和保存模型仍不一致，PROP 和 scope 映射存在风险。媒体上传方式、资源 ID、URL 生命周期、删除、CDN 和 CORS 均未确认。

## 本轮代码收口

- Editor HTTP 按分区加载；
- 未实现分区显式拒绝；
- Storyboard 读取错误向上抛；
- revision/version 只使用后端真实值；
- Script Draft 仅保存已确认的 `rawText/prompt`；
- Script Content 请求 DTO 未确认时抛出 `EDITOR_SCRIPT_CONTENT_CONTRACT_UNCONFIRMED`；
- 不保留猜测性 Script Workspace 写入验证器。

详细步骤参见 `frontend-readiness-handbook.md` 和 `source/frontend-backend-integration-guide.md`。
