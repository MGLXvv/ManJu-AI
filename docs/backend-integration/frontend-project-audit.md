# 前端项目接口接入与可维护性审核

## 1. 审核结论

当前项目已经具备较完整的前端工程基础：Runtime Config、统一 HTTP Client、API Contract、Mock/HTTP Adapter、CapabilityRegistry、GenerationTaskGateway、EditorPersistenceService、MediaUploadService、Fixture、单元测试、Mock E2E、视觉回归和 CI 均已建立。

后续接入成本的主要风险不在页面数量，而在以下几类历史契约漂移：

- 旧 HTTP Adapter 使用了后端文档中不存在的路径；
- 前端聚合保存 Contract 与后端单实体 CRUD 不一致；
- 多个模块在 HTTP 文件内直接处理任意对象，DTO/Mapper 边界不清晰；
- 后端状态和前端接入状态混为一个“READY/未完成”；
- 环境变量可以绕过受控拒绝能力；
- 真实 AI、媒体上传和导出流程尚无完整协议。

本轮已经修复可低风险确定的部分，其余问题按 P0/P1/P2 排序。

## 2. 已有优势

### 架构边界

```text
Page / Component
-> Store / Feature Service
-> Domain Service
-> ApiContract
-> MockAdapter | HttpAdapter
-> Shared HTTP Client
```

该方向正确，应继续保持。

### 运行与安全

- API Mode、Base URL、Proxy 和 Capability 统一读取；
- Token 作为不透明 Session 保存；
- 401 和 403 行为已区分；
- HTTP 模式禁止依赖 Mock；
- 密码、Token、Cookie 和 Authorization Header 不进入 Fixture；
- 临时真实写入工具支持显式授权和自动清理。

### 异步任务和持久化

- GenerationTaskGateway 已统一轮询、超时、恢复、取消和重试；
- EditorPersistenceService 已统一防抖保存、分区脏状态和冲突处理；
- MediaUploadService 已隔离本地临时媒体和稳定后端媒体引用。

### 质量保证

- Linux 和 Windows 双平台质量脚本；
- TypeScript、Vitest 覆盖率和 Build Budget；
- Mock E2E、无障碍基线、视觉回归和长会话诊断；
- 资源体积、Object URL、Timer、Subscription 和 Editor 挂载监控。

## 3. P0：接入真实接口前必须处理

### 3.1 Storyboard 接口迁移

当前 `storyboard.http.ts` 仍使用历史辅助路径：

```text
/storyboard/defaults
/storyboard/shots/{id}/...
```

Integration Pack 的真实接口是项目级 Workspace 和 `/aidrama/storyboards/{id}` CRUD。

建议：

1. 新建 Storyboard Contract 文件；
2. 将 Workspace、CRUD、sort、confirm 分开建 Adapter 方法；
3. 生成图片、视频和高清图不放进 CRUD Adapter；
4. AI Submit 统一进入具体业务 Service，再由 GenerationTaskGateway 跟踪；
5. 保存真实 Workspace、空列表、403 和非法状态 Fixture。

### 3.2 Setting 与 Project Asset 合并边界

当前同时存在：

- `setting.http.ts` 的 `/settings/...` 历史路径；
- `asset.http.ts` 的 Project Asset 列表；
- Editor Asset Mapper；
- SettingAssets Store。

建议把真实后端接入统一为 `projectAsset` 模块：

```text
workspace
list
getById
create
update
remove
batchDelete
saveToLibrary
importFromLibrary
```

页面中的 Setting 概念保留为领域名称，但 HTTP 模块应使用后端 Project Asset 术语，避免同一实体出现两套路径。

### 3.3 Script Content 请求 DTO

路径是 READY，但 Request DTO 尚未从文档得到确认。当前显式阻断是正确处理。

完成条件：

- 后端提供 DTO/OpenAPI 或真实请求示例；
- 保存后能通过 Workspace 或独立读取接口验证；
- Confirm 前置状态明确；
- 失败响应和权限响应有 Fixture。

### 3.4 真实媒体协议

在 Image、Video、TTS 和 Export 接入前，必须冻结：

- 上传方式；
- 文件限制；
- 媒体资源 ID；
- 永久 URL / 临时签名 URL；
- URL 刷新；
- 删除和引用计数；
- CDN、CORS 和鉴权；
- Callback 验签；
- 任务幂等键。

没有这些协议时，不应继续扩展页面内 Data URL 或直接 URL 保存逻辑。

## 4. P1：降低后续接入成本

### 4.1 将 Backend DTO 移回模块目录

`src/types/api-dto.ts` 逐渐成为跨模块大文件。建议后续迁移为：

```text
src/api/modules/project/project.dto.ts
src/api/modules/storyboard/storyboard.dto.ts
src/api/modules/projectAsset/projectAsset.dto.ts
src/api/modules/generation/generation.dto.ts
```

公共协议只保留在 `src/api/shared/`。

### 4.2 为现有真实模块补 `*.contract.ts`

新脚手架已生成机器可读 Contract。建议优先给以下模块补齐：

- auth；
- project；
- script/editor；
- storyboard；
- projectAsset；
- resource；
- voice；
- scriptTemplate；
- generation；
- system。

Contract 记录 Method、Path、后端状态、证据来源和后端 commit，但不参与运行时请求。

### 4.3 统一分页 Contract

当前页面型 Contract 多数直接返回数组，丢失 total、pageNo 和 pageSize。

建议新增：

```ts
interface PageResult<T> {
  list: T[]
  total: number
  pageNo: number
  pageSize: number
}
```

Project、Resource、Voice、Template 和 Generation 逐步迁移。短期内当前 `extractBackendList` 可降低包装差异，但不能替代真正分页。

### 4.4 统一写操作返回语义

建议后端和前端明确三种写响应：

- 返回完整实体；
- 只返回 ID；
- 返回 `null`，要求重新读取 Workspace。

Adapter 不应默认猜测 `data.asset`、`data.voice` 或直接实体。真实 Fixture 到位后删除临时别名。

### 4.5 Store 加载生命周期

部分 Store 只有 `loading/hydrated`，缺少：

- error；
- lastLoadedAt；
- reload；
- AbortSignal；
- 请求去重；
- 页面切换取消；
- 乐观更新失败回滚。

建议先在 Project、Resource 和 System Store 建立统一 AsyncState 模板。

### 4.6 Capability 与后端权限联动

当前 Capability 主要来自构建配置。后续应将：

```text
静态产品能力
+ 后端 readiness
+ Profile permissions
+ 当前实体状态
```

合并为最终页面动作能力。

本轮已禁止环境变量强行开启 CONTROLLED_REJECT 和语义不匹配能力。

## 5. P2：工程质量继续优化

### 5.1 清理 ESLint/Stylelint 历史基线

当前使用非回归基线是合理过渡，但建议按模块逐步归零：

1. API 和 Service；
2. Store；
3. 通用组件；
4. 页面；
5. SCSS。

### 5.2 提升测试重点

当前总体覆盖率约四成，建议不追求平均铺开，优先提升：

- Mapper；
- Capability；
- Store 错误与回滚；
- 任务恢复；
- 媒体清理；
- 真实接口失败 Fixture。

### 5.3 分包与页面懒加载

生产包已受预算保护。后续检查：

- 大型编辑器步骤是否按路由拆包；
- 图标和媒体是否重复打包；
- 资源库、系统管理和登录页是否独立 chunk；
- Mock-only 代码是否进入 HTTP 生产包。

### 5.4 删除重复领域模型

重点检查：

- `Asset`、`SettingAsset`、`ResourceAsset`；
- `StoryboardShot` 与 BackendStoryboardDTO；
- Project Export 与 Editor Export；
- GenerationTask 与业务任务结果。

不是简单合并类型，而是明确“后端实体、前端领域实体、页面视图模型”三层。

## 6. 推荐实施顺序

```text
P0.1 Storyboard Workspace/CRUD
-> P0.2 Project Asset 单实体 CRUD
-> P1.1 模块化 DTO/Contract
-> Project 扩展查询接口
-> Resource 与 Project Asset COPY 流程
-> Voice/Template/Generation 真实 Fixture
-> Auth Code/Register/Reset 页面范围确认
-> 真实 AI Submit/Task/Callback
-> Media Upload
-> Export
```

## 7. 每个后续 PR 的完成定义

- 后端状态和前端状态分开记录；
- `*.contract.ts` 已更新；
- DTO 和 Mapper 不进入页面/Store；
- 不存在猜测路径；
- 不存在 HTTP 失败后 Mock 回退；
- 有成功、空值、失败、401、403、404 Fixture；
- Capability 和 Profile 权限已检查；
- 页面刷新恢复已验证；
- TypeScript、单元测试、构建、Mock E2E 和视觉回归通过；
- 文档记录后端 commit 和仍未完成的完整流程。
