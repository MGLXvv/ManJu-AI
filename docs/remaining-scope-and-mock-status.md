# ManJu-AI 剩余范围与 Mock 状态

## 1. 文档目的

本文用于区分：

- Mock 模式已经可以演示的能力；
- 前端已经预留 HTTP Adapter、但尚未完成真实联调的能力；
- HTTP 模式当前只支持部分操作的能力；
- 当前版本明确暂缓的能力。

模块的实时接口状态以 `docs/api-contract-status-matrix.md` 为准。

## 2. Mock 主流程已覆盖

当前 Mock 模式主要覆盖：

- 账号密码登录；
- 项目创建、列表、进入和前端 JSON 导入导出；
- 文案输入、剧本生成和剧本分镜；
- 角色、场景和道具设定；
- 分镜模式、分镜图、提示词优化、放大和人工审核；
- 视频提示词、对白、视频生成交互和人工审核；
- 配音卡片、角色台词、音色选择和配音生成交互；
- 完成页汇总和 JSON 结果导出；
- 部分错误和失败场景模拟。

这些能力可以作为前端回归基线，但不代表真实模型、媒体落库或后端持久化已经完成。

## 3. 已有 HTTP 预留但尚未完成验证

以下模块已经存在 HTTP Adapter 或接口入口：

- Auth；
- Project；
- Editor；
- Generation；
- Setting；
- Storyboard；
- Voice；
- Resource；
- System；
- Asset；
- Script Template。

“已有预留”只表示后续有明确修改位置。以下事项仍需分别确认：

- 路径和 Method；
- DTO；
- 枚举；
- ID 类型；
- 分页；
- 时间和时区；
- 错误码；
- 权限；
- 上传；
- 异步任务；
- 草稿保存和刷新恢复。

## 4. 当前主要 HTTP 缺口

### Auth

- 账号密码登录部分适配；
- 注册、验证码、找回密码和第三方登录当前不属于已接入能力；
- Session 持久化、Token 刷新和退出语义未冻结；
- 明文记住密码需要优先删除。

### Editor Persistence

- 当前 HTTP 保存未覆盖完整编辑器状态；
- 设定、分镜审核、视频、配音和隐藏状态需要明确保存责任；
- 需要建立统一 Persistence Service 和 revision。

### Generation

- Mock 任务可以运行；
- HTTP 模式统一任务创建、轮询、恢复和批量并发未闭环；
- 当前部分业务端点采用提交后立即解析结果的过渡逻辑；
- 需要建立统一 GenerationTaskGateway。

### Resource Library

- 读取入口存在；
- 创建、编辑和删除当前仍属于未支持或只读能力；
- HTTP 层不应继续依赖 Mock 文件夹数据。

### Upload

- 缺少统一 MediaUploadService；
- 页面仍可能把文件转成 Data URL；
- 资源 ID、永久 URL 和删除规则未确认。

## 5. 后端到位前的前端优先事项

1. 认证安全、Session Repository 和运行配置校验；
2. Capability Registry；
3. GenerationTaskGateway；
4. EditorPersistenceService；
5. 轻量生成结果和 Workspace 刷新；
6. MediaUploadService；
7. CI、契约测试和 Playwright Mock 主流程。

完整任务参见 `docs/frontend-backend-readiness-plan.md` 和 Issue #4。

## 6. 当前版本明确暂缓

- 真实 TTS Provider；
- 真实视频生成模型；
- 字幕时间轴编辑；
- 音频剪辑和混音；
- 剪映工程导出；
- 团队空间；
- 积分、充值和计费；
- 第三方社交登录；
- 完整注册和找回密码；
- 完整批量任务暂停、取消、重试和恢复 UI。

暂缓项不能在验收或项目汇报中描述为已经完成。

## 7. 阶段状态

```text
前端 Mock 主流程：可用于演示和回归
接口适配结构：已初步形成
后端接入准备：进行中
真实 HTTP 联调：未完成
生产发布：未完成
```

## 8. 状态维护规则

- 新增页面或 Mock 不改变 HTTP 状态；
- 新增 HTTP Adapter 只能标记为 `http-reserved`；
- 部分接口可用但流程未闭环标记为 `http-partial`；
- 只读能力标记为 `readonly`；
- 完成真实成功、失败、权限、空值和刷新恢复测试后才标记为 `verified`；
- 每次状态变化同步更新 `docs/api-contract-status-matrix.md`。