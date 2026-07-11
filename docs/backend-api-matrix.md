# Backend API Matrix（历史文档）

## 状态

本文档原用于记录 API Module 是否具备 Mock/HTTP 切换结构。

随着后端接入风险重新评估，仅用“存在 HTTP Adapter”“支持模式切换”已经不足以判断模块是否可以真实联调。例如：

- Generation 模块存在任务查询接口，但 HTTP 创建和完整异步轮询尚未闭环；
- Editor 模块可以读取部分 Workspace，但保存并未覆盖完整编辑器状态；
- Resource 模块 HTTP 模式仍主要是只读；
- Auth 模块只有账号密码登录部分适配，会话恢复和刷新策略未冻结。

因此本文档不再作为当前接口准备程度的判断依据。

## 当前有效文档

请使用：

- `docs/api-contract-status-matrix.md`：当前模块状态、风险和接入动作；
- `docs/frontend-backend-readiness-plan.md`：P0-P6 修复顺序；
- `docs/backend-integration-checklist.md`：接入和验收清单；
- `docs/frontend-backend-integration-guide.md`：接口到位后的标准接入流程。

## 历史结论的正确解释

旧版文档中的：

```text
standardized
mock/http supported
suitable for backend switching
```

只表示：

- 模块已经存在稳定入口；
- 有 Mock 和 HTTP 实现位置；
- 页面通常不需要直接调用 Axios。

它不表示：

- 后端接口已经实现；
- 请求和响应契约已经冻结；
- 异步任务已经可恢复；
- 全部草稿状态已经持久化；
- 模块已经完成真实联调；
- 模块已经达到生产可用。

后续不要在本文档继续维护重复矩阵，所有状态变化统一更新 `docs/api-contract-status-matrix.md`。