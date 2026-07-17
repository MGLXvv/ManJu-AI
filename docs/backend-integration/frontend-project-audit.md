# 前端项目接口接入与可维护性审核

> 状态日期：2026-07-17
>
> 本文描述当前前端收口状态。历史接口证据以 [接口矩阵](./endpoint-matrix.md) 为准；需要后端补齐的交付项以 [后端接口缺口需求说明](./backend-interface-gap-requirements.md) 为准。

## 1. 当前结论

当前前端工程优化已经完成，可以冻结功能开发并等待后端接口证据。

前端已经具备“后端到位后主要修改 Adapter、DTO、Mapper、Fixture 和 Capability”的接入条件，不需要重新设计页面、Store 或主流程。继续在缺少契约的情况下扩展真实写接口，收益低且容易形成猜测性实现。

当前状态：

- 工作区和主分支保持干净；
- ESLint、Stylelint 历史基线均已归零；
- HTTP/Mock 边界、统一 HTTP Client、Contract、Mapper 和 Capability 已建立；
- 编辑器持久化、生成任务、媒体引用与异步生命周期已有统一前端边界；
- Mock E2E、单元测试、视觉回归、长会话诊断和构建预算已经建立；
- 第一方源码没有待处理的 TODO/FIXME；脚手架中的 TODO 是生成新模块后必须替换的契约占位；
- 最终前端优化之后仅有文档提交，生产代码没有新增风险变更。

因此，当前没有必须在等待后端期间继续处理的前端 P0/P1 工程问题。

## 2. 已完成的前端基础

### 2.1 运行配置与网络

- `VITE_API_MODE` 统一控制 `mock` / `http`；
- `VITE_API_BASE_URL` 和 Vite Proxy 统一管理 API 前缀；
- 严格运行配置可在联调和生产环境提前阻止非法配置；
- HTTP 模式不得静默回退 Mock；
- Token、密码和 Authorization 不进入 Fixture、日志或构建变量。

### 2.2 HTTP 与错误处理

- 统一 Axios 实例和请求超时；
- 统一注入 Bearer Token 和 `X-Requested-With`；
- 统一解包 `{ code, msg, data }`；
- `code !== 0` 转换为统一 ApiError；
- 401 清理失效会话；
- 403 保留登录态并进入无权限状态；
- 页面不直接处理后端 DTO 或 Axios 响应。

### 2.3 模块化接入边界

标准模块结构已经形成：

~~~text
<module>.api.ts
<module>.http.ts
<module>.mock.ts
<module>.types.ts
<module>.mapper.ts
~~~

页面和 Store 依赖领域 Contract；后端字段差异只允许在 DTO、Mapper 和 HTTP Adapter 内处理。新模块可使用 `pnpm scaffold:http-module <module-name>` 创建边界骨架。

### 2.4 能力门禁

Capability Registry 已将能力分为：

- `available`；
- `mock-only`；
- `readonly`；
- `unsupported`。

受控拒绝、语义不匹配、媒体上传、真实生成和导出等能力不能通过环境变量强行开启。导航、按钮和业务服务共享同一能力判断。

### 2.5 编辑器持久化

EditorPersistenceService 已统一：

- script、setting、storyboard、video、dubbing、projectMeta 分区；
- 防抖保存、dirty 状态和保存结果；
- 页面切换、过期响应和冲突边界；
- HTTP 未实现分区的显式拒绝；
- Script Draft 已确认字段的真实保存；
- 未确认 Script Content DTO 的显式阻断。

### 2.6 生成任务和媒体

- GenerationTaskGateway 已统一轮询、取消、超时、恢复、重试和批量并发；
- 页面与 Store 不直接维护后端任务状态机；
- 业务生成入口与通用任务查询分离；
- mediaId、远程 URL、Blob URL 和 Data URL 职责已经分离；
- 浏览器临时媒体不会被误作跨会话持久化资源；
- HTTP 上传未确认时显式返回不支持。

### 2.7 工程质量

已完成：

- ESLint 基线归零；
- Stylelint 基线归零；
- 无效 Store 和死状态清理；
- 路由懒加载和稳定 vendor 分包；
- SVG 资源外置；
- Source Asset 扫描排除嵌套 node_modules；
- Build Budget；
- Object URL、Timer、Subscription、异步过期结果和组件卸载测试；
- Windows/Linux 质量脚本；
- Mock E2E、视觉基线和长会话诊断。

旧审核中“继续清理 Lint 基线、分包和重复状态”等建议已经完成，不再作为待办。

## 3. 已完成的真实接口证据

### 3.1 Auth/Profile

已经真实验证：

- 账号密码登录；
- Bearer Session Token；
- Profile 和角色/权限映射；
- 刷新后的会话恢复；
- 无效 Token 401；
- 401 后清理会话。

仍等待后端提供低权限账号 403、生产 Session、Logout/Refresh 策略。

### 3.2 Project

已经真实验证：

- 列表和 `data.list/data.total`；
- 详情；
- 创建；
- 更新/重命名；
- 删除；
- 删除后列表复查；
- 测试数据异常清理。

扩展查询、完整 Update DTO、删除后详情响应和生产权限不阻塞当前冻结状态。

### 3.3 Script Draft

已经真实验证：

- Script Workspace GET；
- Script Draft PUT；
- `rawText/prompt` 写入；
- 保存后重新读取。

Script Content、Confirm、revision/version 和 409 仍缺后端证据，当前显式关闭。

### 3.4 已接入读取或目录边界

已有不同程度 Adapter 支持：

- Storyboard Workspace 读取；
- Project Asset 列表；
- Resource Library；
- Voices；
- Script Templates；
- Generation Tasks 列表、详情、取消和重试；
- System 只读数据。

“已有 Adapter”不等于完整页面写流程已验证，最终状态必须查看接口矩阵。

## 4. 当前剩余缺口

剩余缺口主要属于后端契约或真实环境，而不是前端架构：

### P0：主编辑流程

1. Script Content 请求 DTO、保存响应、写后读和 Confirm；
2. Storyboard 完整 Workspace/CRUD DTO、排序、确认、版本和错误响应；
3. Project Asset 单实体 CRUD 响应、PUT 语义、逻辑删除和写后读；
4. 编辑器领域字段与后端持久化字段的完整映射。

### P0：真实生成与媒体

1. Script/Image/Video/TTS 具体业务 Submit；
2. 任务状态、结果、失败、取消、重试和幂等；
3. multipart 或预签名上传；
4. mediaId、URL 刷新、删除、引用计数和 OSS/CDN；
5. 真实视频合成和下载。

### P1：权限与生产协议

1. 低权限测试账号和稳定 403；
2. Session 过期、Logout 和 Refresh 策略；
3. 时间格式和时区；
4. requestId/traceId；
5. 跨模块错误码；
6. ID、null、空字符串和缺省字段规则；
7. 分页上限、排序、429 和重试；
8. 正式域名、HTTPS、Nginx、上传限制和超时。

详细交付要求见 [后端接口缺口需求说明](./backend-interface-gap-requirements.md)。

## 5. 当前不应继续的前端工作

在没有新后端证据时，不应：

- 根据响应字段反推请求 DTO；
- 根据页面模型补造后端字段；
- 将 HTTP 200 或 `code=0` 当成写入成功；
- 给未验证写能力解除门禁；
- 将 Provider Sandbox 当作真实 Provider；
- 将占位 resultUrl 当作生产媒体；
- 将 Blob/Data URL 长期保存；
- 为历史路径增加新的猜测性兼容；
- 在 HTTP 失败后回退到 Mock；
- 为提高平均覆盖率而编写低价值重复测试。

## 6. 可以进行的非阻塞维护

等待期间仅建议做低频、低风险维护：

- 依赖安全公告和浏览器兼容性检查；
- 后端文档到达后的差异审阅；
- CI 环境或构建工具升级；
- 已知测试不稳定问题修复；
- 文档状态同步。

这些维护不是当前交付阻塞项，不需要主动开启新一轮功能优化。

## 7. 恢复开发的触发条件

满足任一条件后恢复评估：

1. 新 OpenAPI/Swagger；
2. 后端 DTO 或 Controller 源码；
3. 脱敏 Success/Empty/Error Fixture；
4. 可访问测试环境和可自动清理写数据的账号；
5. 低权限账号；
6. 真实 AI、媒体或导出契约；
7. 后端接口版本变化及变更说明。

恢复后按 [后端接口接入执行手册](./backend-integration-runbook.md) 推进，不直接从页面开始修改。

## 8. 推荐恢复顺序

~~~text
Script Content / Confirm
-> Project Asset 单实体 CRUD
-> Storyboard CRUD / sort / confirm
-> 编辑器其他分区持久化
-> 业务 Generation Submit
-> Media Upload
-> Export
-> 生产鉴权与部署协议
~~~

每一项都应独立完成 Contract、DTO、Mapper、Fixture、真实验证、能力门禁和回滚，不把多个证据不足的能力同时开启。

## 9. 冻结判断

当前可以停止前端功能开发并等待后端。

冻结期间保持：

- Mock 主流程可回归；
- HTTP 已验证链路不回退；
- 未验证能力继续关闭；
- 文档和接口矩阵作为唯一状态来源；
- 后端交付新证据后再启动下一轮。