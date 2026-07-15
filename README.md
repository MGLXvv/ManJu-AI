# AI 漫剧创作平台前端

一个基于 Vue 3 的 AI 漫剧/短剧创作工作台，覆盖项目管理、剧本、设定、分镜、视频、配音与完成交付等编辑步骤。

仓库可在内置 **Mock 模式** 下独立演示，也可在 **HTTP 模式** 下接入后端网关。两种模式能力不同；本文明确标出限制，避免将演示能力误认为生产能力。

## 目录

- [功能](#功能)
- [技术栈与要求](#技术栈与要求)
- [快速开始](#快速开始)
- [运行模式与配置](#运行模式与配置)
- [使用流程](#使用流程)
- [能力边界](#能力边界)
- [架构与目录](#架构与目录)
- [测试与质量](#测试与质量)
- [常见问题](#常见问题)
- [贡献](#贡献)

## 功能

### 使用者功能

- 登录、会话恢复、鉴权/权限错误提示与恢复页。
- 项目创建、编辑、删除和工作区恢复。
- 剧本输入与结果管理。
- 角色、场景、道具等设定资产管理。
- 分镜草稿、提示词、参数、预览和批量处理。
- 图片、视频、配音生成任务的轮询、恢复、取消与重试（依运行模式而定）。
- 资源库、音色管理和系统管理页面。
- 浏览器端媒体 Blob 持久化与 Object URL 清理。

主要创作步骤：

```text
剧本输入 → 剧本分镜 → 设定管理 → 分镜制作 → 视频生成 → 配音制作 → 项目完成
```

### 开发者能力

- 按业务域拆分的 API 门面、HTTP/Mock 实现、DTO 映射与类型契约。
- Pinia 管理认证、项目、编辑器、生成任务、资源、音色和界面反馈状态。
- `features/` 集中页面交互状态和能力开关；`services/` 提供工作流、持久化、媒体和运行时服务。
- Vitest 单元/契约测试，Playwright Mock 主流程、可访问性和视觉回归测试。

## 技术栈与要求

| 类别       | 技术                                         |
| ---------- | -------------------------------------------- |
| 框架       | Vue 3、TypeScript、Vite                      |
| 状态与路由 | Pinia、Vue Router、vue-i18n                  |
| 网络       | Axios                                        |
| 样式       | Sass、Stylelint                              |
| 测试       | Vitest + V8 Coverage、Playwright、pixelmatch |
| 包管理器   | pnpm `10.12.1`                               |
| Node.js    | `>= 22.18.0`                                 |

`.nvmrc` 固定 Node.js `22.18.0`；建议通过 Corepack 使用项目要求的 pnpm。

## 快速开始

### 安装

```bash
corepack enable
pnpm install --frozen-lockfile
```

### 启动 Mock 模式

`.env.example` 默认使用 Mock 模式。可复制为本地环境文件：

```bash
# macOS / Linux
cp .env.example .env.local

# PowerShell
Copy-Item .env.example .env.local
```

```bash
pnpm dev
```

开发服务器监听 `0.0.0.0`，具体地址和端口以 Vite 启动输出为准。

Mock 预置账号：

```text
账号：admin11
密码：123456
```

> 该账号只存在于浏览器本地 Mock 数据中，不能用于真实环境。

### 构建与预览

```bash
pnpm build
pnpm preview
```

`pnpm build` 会执行类型检查、生产构建、构建报告和体积预算检查，产物输出到 `dist/`。

## 运行模式与配置

### Mock 模式

适合前端开发、界面演示与自动化回归：

```dotenv
VITE_API_MODE=mock
```

Mock 数据使用本地存储和内置媒体/任务；部分写入、导入导出或生成任务行为仅供演示。

### HTTP 联调模式

将 `.env.integration.example` 复制为 `.env.integration.local`，再配置目标环境：

```dotenv
VITE_API_MODE=http
VITE_API_BASE_URL=/admin-api
VITE_DEV_PROXY_TARGET=http://your-backend-host:48080
VITE_STRICT_RUNTIME_CONFIG=true
```

浏览器请求由 `VITE_API_BASE_URL` 控制。开发期设置 `VITE_DEV_PROXY_TARGET` 后，Vite 会把 `/admin-api` 转发至该目标。请勿提交私有地址、密钥或本地环境文件。

| 变量                         | 用途                                        |
| ---------------------------- | ------------------------------------------- |
| `VITE_API_MODE`              | `mock` 或 `http`；未设置时默认为 `mock`。   |
| `VITE_API_BASE_URL`          | HTTP 基础路径，默认 `/admin-api`。          |
| `VITE_DEV_PROXY_TARGET`      | Vite 对 `/admin-api` 的代理目标。           |
| `VITE_STRICT_RUNTIME_CONFIG` | 严格校验运行时 API 模式。生产构建也会启用。 |
| `VITE_ENABLED_CAPABILITIES`  | 逗号分隔的已验证能力覆盖列表。              |
| `VITE_DISABLED_CAPABILITIES` | 逗号分隔的部署级禁用列表。                  |
| `VITE_DEV_ALLOWED_HOSTS`     | 额外允许访问开发服务器的主机名列表。        |

能力开关不能绕过未完成的接口、权限或业务契约。

## 使用流程

1. 在项目列表创建或打开项目。
2. 在“剧本输入”填写创作内容并处理结果。
3. 在“设定管理”维护角色、场景、道具等资产。
4. 在“分镜制作”组织镜头、提示词与生成参数。
5. 在“视频生成”和“配音制作”跟踪任务与结果。
6. 在“项目完成”页查看当前工作区汇总。

本地上传/生成媒体优先保存到 IndexedDB；不可用时回退至内存。因此清理站点数据、无痕模式或浏览器存储失败可能使本地媒体无法恢复。跨设备、跨会话的媒体持久化应由后端实现。

## 能力边界

能力注册表会将操作标识为可用、仅 Mock、只读或不支持：

| 能力                              | Mock    | HTTP   | 备注                         |
| --------------------------------- | ------- | ------ | ---------------------------- |
| 账号密码登录、资源读取            | 可用    | 可用   | 需匹配后端契约和权限。       |
| 资源库写入、音色写入              | 仅 Mock | 可用   | 仍受后端验证和能力开关影响。 |
| 生成任务取消、重试                | 仅 Mock | 可用   | 依赖后端任务语义。           |
| 系统样式/权限写入                 | 仅 Mock | 只读   | HTTP Phase 1 受控拒绝。      |
| 项目导入、项目 JSON 导出          | 仅 Mock | 不支持 | 前后端契约尚未对齐。         |
| 导出任务、剪映工程导出            | 不支持  | 不支持 | 暂无已确认的端到端支持。     |
| 验证码/第三方登录、注册、重置密码 | 不支持  | 不支持 | 不在当前前端交付范围。       |

不要因 Mock 模式成功而推断真实后端已支持同一操作。

## 架构与目录

```text
src/
├─ api/          # HTTP 客户端、拦截器和业务 API 模块
├─ assets/       # 图标、登录背景等静态资源
├─ components/   # 通用与编辑器组件
├─ config/       # 运行时配置
├─ features/     # 页面交互状态、草稿/批量操作、能力控制
├─ layouts/      # 登录、主界面、编辑器布局
├─ mocks/        # 内置 Mock 数据
├─ pages/        # 登录、项目、编辑器、资源、音色、系统和恢复页
├─ router/       # 路由、权限和标题元数据
├─ services/     # 工作流、生成任务、媒体、认证和运行时服务
├─ stores/       # Pinia stores
├─ styles/       # Token、主题、布局、页面与组件样式
└─ types/        # DTO、领域模型、枚举与类型

tests/           # 单元、契约和集成测试
tools/           # E2E、视觉回归、集成与质量脚本
public/          # Mock 播放媒体与公开静态资源
```

每个业务 API 模块通常包含 API 门面、HTTP 实现、Mock 实现、类型和映射层，并根据 `VITE_API_MODE` 选择实现。生成任务网关统一处理请求 ID、轮询、超时、取消信号和批量并发。

## 测试与质量

```bash
# 单元、契约与覆盖率
pnpm test
pnpm test:contracts
pnpm test:coverage

# Mock E2E、可访问性与视觉回归
pnpm test:e2e:mock
pnpm test:e2e:a11y
pnpm test:visual

# 静态检查、类型和构建
pnpm check:static
pnpm typecheck
pnpm build:verify

# 完整质量门禁
pnpm check:quality
```

`pnpm check:quality` 汇总静态边界检查、ESLint/Prettier/Stylelint、类型检查、全量测试、生产构建、构建报告和体积预算。诊断产物分别位于 `artifacts/quality`、`artifacts/coverage`、`artifacts/build` 和 `artifacts/e2e`。

视觉基线在 `tools/e2e/visual-baselines/`。确认 UI 变更后才可运行：

```bash
pnpm test:visual:update
```

## 常见问题

### HTTP 模式请求失败

确认 `VITE_API_MODE=http`，并检查 `VITE_API_BASE_URL`、`VITE_DEV_PROXY_TARGET` 与网关是否一致。浏览器端建议维持相对 `/admin-api` 路径，由 Vite 或部署环境转发。

### HTTP 模式下按钮不可用

先检查该操作是否标记为 HTTP 可用，以及是否被 `VITE_DISABLED_CAPABILITIES` 禁用。标记为不支持的功能不能通过 `VITE_ENABLED_CAPABILITIES` 强制启用。

### 本地媒体刷新后丢失

媒体依赖 IndexedDB；不支持、站点数据被清理或存储失败时会降级为内存，刷新后无法恢复。

### 为什么环境文件没有被提交

`.env` 和 `.env.*` 默认被忽略，只有 `.env.example` 保留在仓库。个人配置请使用 `.env.local` 或 `.env.integration.local`。

## 贡献

1. 使用 `pnpm install --frozen-lockfile` 安装依赖。
2. 修改业务行为时同步更新 Vitest 测试；主流程变更还应考虑 Mock E2E 和视觉基线。
3. 提交前运行与改动范围相符的检查；CI 级验证使用 `pnpm check:quality`。
4. 不要在生产源码保留 `debugger`、`console.log` 或 `@ts-nocheck`，也不要绕开 HTTP/Mock 边界。
5. 新增媒体资源前核对体积预算，不能仅为通过 CI 而提高预算。

当前 `package.json` 中的许可证字段为 `ISC`。真实发布或接入生产服务前，请确认组织层面的许可证、隐私、安全和后端接入要求。
