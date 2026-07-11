# API Module Audit（结构审计说明）

## 1. 文档定位

本文档只用于说明前端 API Module 的结构是否标准化，不再用于判断真实后端是否已经可以接入或模块是否生产可用。

结构标准化通常指：

```text
src/api/modules/<module>/
├─ <module>.api.ts
├─ <module>.mock.ts
├─ <module>.http.ts
├─ <module>.types.ts
├─ <module>.mapper.ts（按需）
└─ index.ts
```

标准调用方向：

```text
Page / Component
  -> Store / Service
  -> ApiContract
  -> MockAdapter | HttpAdapter
```

## 2. 当前结构结论

以下模块已经具备或基本具备 Mock/HTTP 入口：

- `auth`
- `project`
- `editor`
- `generation`
- `setting`
- `storyboard`
- `voice`
- `resource`
- `system`
- `asset`
- `scriptTemplate`

该结论只表示：

- 上层通常可以通过稳定入口调用；
- HTTP 差异有明确收敛位置；
- 后续可以在 DTO 和 Mapper 中适配真实字段。

## 3. 结构标准化不等于联调完成

即使模块具备完整目录，也仍可能存在：

- HTTP 方法仍抛 `unsupported`；
- 接口路径只是前端预留；
- 后端响应 DTO 未确认；
- HTTP 层仍引用 Mock 数据；
- 保存只覆盖部分字段；
- 异步任务缺少轮询和恢复；
- 上传仍使用 Data URL；
- 页面未根据能力状态禁用操作；
- 缺少真实权限、错误和刷新测试。

因此不要继续使用“suitable for backend switching”作为联调完成结论。

## 4. 仍需治理的结构问题

### Auth

- 通用存储键和错误枚举不应由 `auth.mock.ts` 提供；
- Session 持久化和 Token 刷新需要独立 Repository/Service；
- 页面不得保存明文密码。

### Generation

- Mock 任务可运行，但 HTTP 创建和异步恢复尚未闭环；
- 需要统一 `GenerationTaskGateway`；
- 当前完整 `shot/asset/card` 结果只应视为过渡结构。

### Editor

- 需要统一 `EditorPersistenceService`；
- Script、Setting、Storyboard、Video、Dubbing、Project Meta 需要明确保存责任。

### Resource / Setting / Asset

- 需要冻结公共资源库、项目资产和设定资产的领域边界；
- HTTP 只读或未实现能力应通过 Capability Registry 提前暴露。

### Upload

- 需要独立 `MediaUploadService`；
- 页面不应长期保存 Base64 Data URL。

## 5. 当前有效状态来源

模块当前是否可接入、可读取、可写入或被阻塞，以以下文档为准：

- `docs/api-contract-status-matrix.md`
- `docs/frontend-backend-readiness-plan.md`
- `docs/backend-integration-checklist.md`

## 6. 后续结构审计规则

新增或修改模块时检查：

- [ ] Page 和 Component 不导入 HTTP、DTO 或 Mock
- [ ] Store 不处理后端字段兼容
- [ ] Service 不依赖具体后端响应
- [ ] HTTP Adapter 不导入 `*.mock.ts`
- [ ] Mock Adapter 不导入 Page、Store 或其他业务 API
- [ ] DTO 与前端领域模型通过 Mapper 隔离
- [ ] 未实现能力有 Capability Status
- [ ] 路径和 Mapper 有测试
- [ ] 接口状态矩阵同步更新

本文档后续只维护结构规则，不维护重复接口路径和模块联调状态。