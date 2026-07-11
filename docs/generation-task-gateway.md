# GenerationTaskGateway 实施说明

## 状态

第二轮 P2 前端任务层实现。该实现统一 Mock 与 HTTP 适配器之上的任务调用边界，但不表示后端已经支持通用任务创建。

HTTP 模式下，未实现能力仍由 `generation.http.ts` 返回明确错误，不允许回退 Mock。

## 统一入口

```ts
import { generationTaskGateway } from '@/services/generation'
```

Gateway 提供：

- `create`
- `getById`
- `listByProject`
- `cancel`
- `retry`
- `waitForTask`
- `createAndWait`
- `listRecoverableByProject`
- `recoverProjectTasks`

旧 `generationTaskRunner` 暂时保留为兼容入口，内部已经完全委托给 Gateway。现有文案、设定图、分镜图、视频和配音 Mock Service 因而统一经过同一任务边界。

## 轮询

`waitForTask` 统一处理：

- 默认轮询间隔；
- 最大等待时间；
- `AbortSignal`；
- 任务不存在；
- 成功；
- 失败及业务错误信息；
- 已取消任务。

页面卸载或路由切换时应中止对应的 `AbortController`，避免后台继续轮询。

```ts
const controller = new AbortController()

const task = await generationTaskGateway.waitForTask(taskId, {
  interval: 600,
  timeout: 30_000,
  signal: controller.signal,
})

controller.abort()
```

## 刷新恢复

任务由适配器持久化。项目重新进入后，可先加载任务，再恢复仍处于 `queued` 或 `running` 的任务：

```ts
const results = await generationTaskGateway.recoverProjectTasks(projectId, {
  concurrency: 3,
  signal,
})
```

`useGenerationStore` 已增加 `recoverActiveTasks`，并会把成功任务和恢复后查询到的失败任务重新写入 Store。

## 有限并发与失败隔离

`createAndWait` 内部使用统一执行队列，默认最多同时运行 3 个生成任务。现有文案、设定图、分镜图、视频和配音 Mock Service 都通过该入口，因此即使页面一次提交多个任务，也不会无上限创建和轮询。

这也为当前视频页的并行批量生成提供了实际并发上限，而不要求页面自行维护第二套信号量。

通用批处理入口：

```ts
const results = await runGenerationTaskBatch(items, worker, {
  concurrency: 3,
  signal,
})
```

返回结果保持输入顺序，每一项分别为：

- `fulfilled`
- `rejected`

单项失败不会终止其他任务。整体 `AbortSignal` 中止时停止继续分配任务。等待执行槽位的任务也可以通过 `AbortSignal` 取消。

## requestId 与幂等

`CreateGenerationTaskInput` 和 `GenerationTask` 已预留 `requestId`。

- 调用方提供 `requestId` 时，Gateway 原样传递；
- 未提供时，Gateway 生成请求 ID；
- Mock 适配器对同一项目、同一 `requestId` 返回已有任务，不重复创建；
- 后端接口到位后，应确认幂等窗口、失败重试和取消后重提语义。

需要跨页面重试或防止重复点击时，调用方应生成并复用稳定的 `requestId`，而不是每次重新调用时依赖自动生成值。

## Store 边界

`useGenerationStore` 的以下操作已经迁移到 Gateway：

- hydrate/list
- create
- get/sync
- cancel
- retry
- poll
- recover

`setTaskStatus` 暂时保留给当前 Mock 测试和本地编排，后端模式仍由适配器明确拒绝。页面业务不应主动推进后端任务状态。

原有 `src/services/taskPolling.ts` 已删除，避免出现第二套轮询实现。

## 测试覆盖

新增或更新测试覆盖：

- Gateway 生命周期委托；
- 自动和显式 `requestId`；
- HTTP Adapter 错误透传且不回退 Mock；
- AbortSignal 中止；
- 轮询超时、失败、取消和不存在；
- `createAndWait` 默认最多 3 个并发任务；
- 通用批处理自定义有限并发；
- 批次单项失败隔离；
- 项目运行任务恢复；
- Mock `requestId` 幂等；
- Store 创建任务经过 Gateway。

## 本地验证

```bash
pnpm test
pnpm build
```

PR 在上述命令通过前保持 Draft。
