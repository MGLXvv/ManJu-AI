# 当前前端接入准备度审计

审计范围：运行配置、共享 HTTP Client、认证、项目、编辑器持久化、生成任务、媒体、CapabilityRegistry、Fixture、契约测试和联调文档。

## 1. 总体结论

当前前端已经具备“后端到位后只修改适配层”的基础框架，不需要重新设计页面或 Store。

后续主要工作应集中在：

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

## 2. 已完成的框架

### 2.1 运行配置

- `runtimeConfig.ts` 统一读取 Mock/HTTP 模式、Base URL 和能力覆盖；
- 默认 Base URL 为 `/admin-api`；
- 测试和生产可启用严格配置；
- Vite 支持 `/admin-api` 代理到测试服务器；
- 页面和业务代码不需要知道 WireGuard IP。

### 2.2 共享 HTTP Client

- 请求统一设置 Bearer Token；
- 响应统一兼容 `{ code, msg, data }`；
- 业务 `code !== 0` 转换为 ApiError；
- 401 清理或过期 Session；
- 403 保留 Session 并进入无权限状态；
- Token、密码和敏感 Header 不写入 Fixture。

### 2.3 模块化 Adapter

标准目录已经形成：

```text
<module>.api.ts
<module>.http.ts
<module>.mock.ts
<module>.types.ts
<module>.mapper.ts
```

页面、组件和 Store 基本通过 Contract 或 Domain Service 调用，不需要直接适配后端 DTO。

### 2.4 CapabilityRegistry

未验证能力可以标记为：

```text
available
mock-only
readonly
unsupported
```

Project Import、Export Task、Resource Write、Voice Write、System Write、Generation cancel/retry 等能力已有统一保护，不需要页面自行判断。

### 2.5 编辑器持久化边界

- `EditorPersistenceService` 已存在；
- 草稿分为 Script、Setting、Storyboard、Video、Dubbing、ProjectMeta；
- PR #33 让 HTTP Adapter 按显式分区加载；
- 未实现分区不再返回默认数据或假装保存成功；
- Storyboard Workspace 错误不再被吞掉；
- revision/version 只采用后端真实返回值。

### 2.6 生成任务和媒体边界

- GenerationTaskGateway 和任务状态抽象已存在；
- 通用 create/update 已按后端 Phase1 稳定拒绝处理；
- 文件上传和生成结果已有前端抽象；
- 真实上传、OSS/CDN、临时 URL 和媒体持久化仍等待后端契约。

### 2.7 测试和质量门

当前已有：

- HTTP Adapter 单元测试；
- 脱敏真实 Fixture；
- Mock 主流程 E2E；
- 长会话资源诊断；
- 视觉回归；
- Windows 质量脚本；
- Build Budget；
- HTTP/Mock 边界检查。

## 3. 已完成的真实证据

### Auth

已完成：

- 账号密码登录；
- Profile；
- 登录后角色与权限映射；
- 持久化 Token 的 Profile 恢复；
- 失效 Token 401；
- 401 清理 Session 和登录页提示。

仍缺：

- 低权限账号 403；
- 后端 Logout；
- 生产 Session 和 Refresh。

### Project

已完成：

- `list/total` 分页；
- 详情 DTO；
- 创建临时项目；
- 查询详情；
- 重命名；
- 删除；
- 删除后列表不可见；
- 失败自动清理脚本。

仍缺：

- 页面级完整验收；
- batch-delete、copy、statistics、overview、tasks、pipeline；
- 完整 update DTO；
- 删除后详情行为；
- 低权限 403。

### Script Draft

已确认：

- Workspace GET；
- Draft PUT 的 `rawText/prompt`；
- 写入后重新读取一致。

明确未确认：

- Script Content PUT 的请求 DTO；
- Confirm 的完整前置条件；
- revision/version 和 409；
- 剧本分镜文本的独立持久化字段。

真实探测证明 `{ content }` 虽然返回 `code=0`，但 Workspace 的 `scriptContent` 仍为空。因此不能继续根据响应字段反推 `{ scriptContent }`。

## 4. 当前主要风险

### P0：状态语义混乱

历史文档同时使用 READY、implemented、partial、verified，容易把“文档声明”和“真实验收”混为一类。

处理：

- 统一使用 endpoint-matrix 的证据状态；
- `verified` 只保留给完整真实验收；
- `contract-verified` 表示基础契约已有真实证据。

### P0：猜测性 DTO

高风险位置包括：

- Script Content 请求体；
- Voice、Script Template、Generation 的分页包裹字段；
- Project Asset 的路径和批量保存模型；
- Resource scope/type；
- revision/version 和 409。

处理：

- 未确认接口显式阻断；
- 后端提供 OpenAPI、DTO 或 Fixture 后只修改 Adapter 和 Mapper。

### P0：Mock 能力被误认为真实能力

后端文档中的 Script Generate、Storyboard Generate、Provider Sandbox 和 Export 均包含 Mock 或占位行为。

处理：

- 标记为 `mock-only`；
- UI 不显示“真实生成完成”；
- 占位 resultUrl 不进入永久媒体模型。

### P1：Project Asset 和 Resource 边界

当前仍存在：

- `/projects/{id}/assets` 与 `/aidrama/projects/{id}/assets` 路径差异；
- 整体保存与单资产 CRUD 模型差异；
- PROP 丢失风险；
- OFFICIAL 与 PRIVATE/SYSTEM/SHARED 枚举差异。

处理：

- 后端提供真实 Fixture 后重做 Asset Adapter；
- 页面领域模型保持不变。

### P1：媒体上传和 URL 生命周期

尚未确认：

- 上传方式；
- 资源 ID；
- 永久 URL 或签名 URL；
- URL 刷新；
- 删除和引用计数；
- 文件限制；
- CDN 和 CORS。

处理：

- HTTP 模式不持久化 Data URL、Blob URL 或 Mock resultUrl；
- MediaUploadService 保持接口占位。

## 5. 本轮代码收口

PR #33 最终只保留框架改进：

- Editor HTTP 按分区加载；
- 未实现分区显式拒绝；
- Storyboard 读取错误向上抛；
- revision/version 只使用后端真实值；
- Script Draft 仅保存已确认的 `rawText/prompt`；
- Script Content 请求 DTO 未确认时抛出 `EDITOR_SCRIPT_CONTENT_CONTRACT_UNCONFIRMED`；
- 删除猜测性 Script Workspace 写入验证器。

## 6. 后端到位后的推荐顺序

```text
Auth/Profile
-> Project CRUD 页面验收
-> Script Draft
-> Storyboard CRUD
-> Project Asset
-> Resource Library
-> Voice / Script Template
-> Generation Task 查询与控制
-> 真实业务生成 Submit
-> Media Upload
-> Export
```

真实 Image、Video、TTS 和 Export 必须等待算法、Callback、媒体存储和下载契约完整后再接入。

详细接入步骤参见 `frontend-integration-handbook.md`。
