# 后端接口缺口需求说明

> 接收方：后端开发、架构、测试与部署人员
>
> 状态日期：2026-07-17
>
> 目标：明确当前前端主流程仍缺少的后端契约、真实响应和可验证环境，作为后端排期、实现、联调和验收依据。
>
> 本文中的“已知路径”来自现有 Integration Pack、Phase1 文档和前端真实验证；“建议契约”是前端消费需求，不代表后端已经确认。后端可以调整字段或路径，但必须提供等价能力和正式契约。

## 1. 交付目标

后端完成本文 P0 后，前端应能在 HTTP 模式下完成：

1. 登录并进入项目；
2. 保存、确认剧本；
3. 创建、编辑、排序、删除并确认分镜；
4. 创建、编辑、删除项目资产；
5. 提交图片、视频、配音等真实生成任务；
6. 轮询、取消、重试并恢复任务；
7. 上传和持久化媒体资源；
8. 合成、查询和下载真实导出产物；
9. 刷新页面后从后端恢复完整编辑状态；
10. 在无权限、冲突、限流和服务异常时得到稳定错误。

## 2. 当前不需要后端重复实现的内容

以下链路已经存在或完成真实验证，除非契约发生变化，否则不属于本轮缺口：

| 模块                                     | 当前证据                      |
| ---------------------------------------- | ----------------------------- |
| CommonResult                             | `code/msg/data` 已接入        |
| 账号密码登录                             | 已真实验证                    |
| Profile/Session 恢复                     | 已真实验证                    |
| 无效 Token 401                           | 已真实验证                    |
| Project 基础列表/详情/CRUD               | 已真实验证                    |
| Script Workspace GET                     | 已真实验证                    |
| Script Draft PUT                         | `rawText/prompt` 已完成写后读 |
| Storyboard Workspace GET                 | 已有 HTTP Adapter             |
| Project Asset 列表                       | 已有 HTTP Adapter             |
| Resource Library 基础 CRUD               | 已有 HTTP Adapter             |
| Voices/Script Templates                  | Phase1 已提供目录 CRUD        |
| Generation Task list/detail/cancel/retry | Phase1 标记 REAL              |

如上述接口计划调整，请提供变更说明、兼容期和新的 Fixture，避免前端把已有真实链路误判为回归问题。

## 3. 优先级与状态定义

| 优先级 | 含义                                                     |
| ------ | -------------------------------------------------------- |
| P0     | 主编辑、生成或导出流程阻断，前端能力门禁当前关闭         |
| P1     | 不阻断 Mock 主流程，但影响真实权限、稳定性和完整页面闭环 |
| P2     | 管理、兼容或后续产品范围，可在 P0/P1 后处理              |

后端交付状态建议统一为：

- `PLANNED`：已进入后端排期；
- `CONTRACT_READY`：OpenAPI/DTO 和错误语义已冻结；
- `IMPLEMENTED`：代码完成但未联调；
- `TESTABLE`：测试环境已部署并提供账号/数据；
- `VERIFIED`：前后端完成真实验收；
- `OUT_OF_SCOPE`：明确不在当前版本，并提供替代方案或稳定拒绝。

后端 `IMPLEMENTED` 不等于前端 `VERIFIED`。

## 4. 所有新增或补齐接口的公共要求

### 4.1 响应包装

继续使用：

```json
{
  "code": 0,
  "msg": "success",
  "data": {}
}
```

请明确：

- 成功业务码是否固定为 `0`；
- 删除、确认、取消等接口成功时 `data` 是实体、ID 还是 `null`；
- HTTP 非 2xx 是否仍返回 CommonResult；
- 业务失败是否可能使用 HTTP 200；
- `requestId/traceId` 位于 Header 还是响应体。

### 4.2 分页

统一建议：

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [],
    "total": 0
  }
}
```

请求参数建议统一为：

- `pageNo`：从 1 开始；
- `pageSize`：提供默认值和最大值；
- `keyword`；
- 模块可选的 `status/type/scope`；
- 明确排序字段、默认排序和非法排序错误。

### 4.3 ID、时间和空值

后端需要冻结：

- ID 是整数还是字符串；
- 时间格式、精度和时区；
- `null`、空字符串、空数组和字段缺省的区别；
- 枚举未知值的兼容策略；
- 删除后详情是 404、业务错误还是返回删除标记；
- 逻辑删除字段和查询默认行为。

前端可将 ID 转为字符串，但不能猜测时间和空值语义。

### 4.4 鉴权与权限

除公开 Auth 接口外，所有管理端接口继续要求：

```http
Authorization: Bearer <accessToken>
```

每个写接口请明确：

- 允许的角色或权限键；
- 项目/租户资源隔离；
- 资源不存在与无权限是否区分；
- 401 与 403 的稳定响应；
- 低权限测试账号。

### 4.5 写入、冲突与幂等

所有写接口需要明确：

- PUT 是全量替换还是部分更新；
- PATCH 的字段缺省语义；
- 重复提交是否幂等；
- 幂等键放在 Header 还是请求体；
- 是否提供 `revision/version`；
- 版本冲突是否返回 HTTP/业务 409；
- 成功后返回完整实体、ID 或要求重新读取；
- 写后读应使用哪个接口确认。

### 4.6 错误 Fixture

每个 P0 接口至少提供脱敏的：

1. Success；
2. Empty；
3. Validation Error；
4. 401；
5. 403；
6. 404；
7. 409（适用时）；
8. 429（异步/高频接口）；
9. 500；
10. 超时或下游 Provider 失败（生成/上传/导出）。

## 5. P0-01：Script Content 与 Confirm

### 5.1 已知接口

| Method | Path                                                       | 当前状态               |
| ------ | ---------------------------------------------------------- | ---------------------- |
| GET    | `/admin-api/aidrama/projects/{projectId}/script/workspace` | 已真实验证             |
| PUT    | `/admin-api/aidrama/projects/{projectId}/script/draft`     | 已真实验证             |
| PUT    | `/admin-api/aidrama/projects/{projectId}/script/content`   | 路径已知，DTO 未确认   |
| POST   | `/admin-api/aidrama/projects/{projectId}/script/confirm`   | 路径已知，副作用未确认 |

### 5.2 当前阻塞

历史探测向 Content 写入 `{ content }` 时返回 `code=0`，但 Workspace 没有读回内容。因此前端不能确认：

- 正式请求字段；
- 内容结构是纯文本、JSON 还是段落数组；
- 成功是否真正落库；
- Content 与 Draft 的关系；
- Confirm 的前置条件和副作用；
- 版本冲突和错误语义。

### 5.3 后端需要交付

#### Content 请求 DTO

请至少明确：

- 正式字段名；
- 内容类型；
- 最大长度；
- 是否允许空内容；
- 是否支持结构化场景、角色、对白；
- 是否需要 `expectedRevision/version`；
- 是否需要幂等键；
- 保存后脚本状态如何变化。

建议后端返回：

```json
{
  "id": "<scriptId>",
  "projectId": "<projectId>",
  "scriptContent": "<saved-content-or-structured-content>",
  "scriptStatus": "SAVED",
  "revision": 2,
  "updateTime": "2026-07-17T12:00:00+08:00"
}
```

字段名可调整，但必须支持写后读确认。

#### Confirm 契约

请明确：

- 前置状态；
- 内容为空、任务进行中或版本过期时的错误；
- Confirm 是否幂等；
- 确认后 `scriptStatus`；
- `canEnterStoryboard` 的计算规则；
- 是否锁定内容；
- 再次编辑是否需要取消确认或产生新 revision。

建议返回最新 Script Workspace 或至少返回状态、revision 和更新时间。

### 5.4 验收条件

- Content 保存后通过 Workspace 或独立 GET 读取到完全一致的内容；
- Confirm 后状态变为 CONFIRMED；
- 空内容 Confirm 得到稳定校验错误；
- 旧 revision 写入得到 409；
- 低权限账号得到 403；
- 刷新页面后内容和状态保持；
- 提供 Success/400/401/403/404/409 Fixture。

## 6. P0-02：Project Asset 单实体 CRUD

### 6.1 已知接口

| Method | Path                                             | 用途         |
| ------ | ------------------------------------------------ | ------------ |
| GET    | `/admin-api/aidrama/projects/{projectId}/assets` | 项目资产列表 |
| POST   | `/admin-api/aidrama/projects/{projectId}/assets` | 创建资产     |
| GET    | `/admin-api/aidrama/assets/{assetId}`            | 资产详情     |
| PUT    | `/admin-api/aidrama/assets/{assetId}`            | 更新资产     |
| DELETE | `/admin-api/aidrama/assets/{assetId}`            | 逻辑删除     |
| POST   | `/admin-api/aidrama/assets/batch-delete`         | 批量删除     |
| POST   | `/admin-api/aidrama/assets/{assetId}/favorite`   | 收藏切换     |

已知创建字段：

```json
{
  "type": "CHARACTER",
  "name": "角色名称",
  "description": "角色描述",
  "imageUrl": "",
  "extraJson": "{\"prompt\":\"anime character\",\"favorite\":false}"
}
```

`type` 支持 `CHARACTER/SCENE/PROP`，`extraJson` 当前为 JSON 字符串。

### 6.2 当前阻塞

前端现有页面使用聚合资产数组保存，无法安全映射到单实体 CRUD。迁移到单实体调用前还缺：

- 创建成功实体和 ID；
- PUT 全量/部分更新语义；
- 更新成功响应；
- 逻辑删除后的列表/详情行为；
- 图片与 mediaId 的字段；
- 收藏请求体和响应；
- revision/version；
- 真实写后读和自动清理环境。

### 6.3 后端需要交付

请提供完整 Asset DTO，至少包含：

- `id/projectId/type/name/description`；
- `imageUrl`；
- 稳定 `imageMediaId` 或后端认可的媒体引用；
- `extraJson` 的正式 schema 或继续明确为透明 JSON 字符串；
- `favorite`；
- `deleted` 或删除状态（如果会返回）；
- `revision/version`；
- `createTime/updateTime`。

请明确：

- 创建后是否返回完整实体；
- PUT 是否允许只提交修改字段；
- 空字符串是否清空字段；
- 类型能否修改；
- 删除是否幂等；
- 被 Storyboard/Resource 引用时能否删除；
- 批量删除请求体和部分失败响应；
- favorite 是显式布尔值还是 toggle；
- 跨项目访问详情的权限行为。

### 6.4 验收条件

- 创建后列表和详情都能读取新 ID；
- 更新后详情与列表一致；
- 删除后列表移除，详情行为符合文档；
- CHARACTER/SCENE/PROP 均通过；
- 非法 type、空 name、跨项目访问、低权限和引用冲突有稳定错误；
- 测试脚本可以完整创建、读取、更新、删除和清理；
- 提供 Success/400/401/403/404/409 Fixture。

## 7. P0-03：Storyboard 完整读写

### 7.1 已知接口

| Method | Path                                                                 | 用途      |
| ------ | -------------------------------------------------------------------- | --------- |
| GET    | `/admin-api/aidrama/projects/{projectId}/storyboard/workspace`       | Workspace |
| GET    | `/admin-api/aidrama/projects/{projectId}/storyboards`                | 列表      |
| POST   | `/admin-api/aidrama/projects/{projectId}/storyboards`                | 新增      |
| PUT    | `/admin-api/aidrama/projects/{projectId}/storyboards/{storyboardId}` | 更新      |
| DELETE | `/admin-api/aidrama/projects/{projectId}/storyboards/{storyboardId}` | 逻辑删除  |
| PUT    | `/admin-api/aidrama/projects/{projectId}/storyboards/sort`           | 排序      |
| POST   | `/admin-api/aidrama/projects/{projectId}/storyboard/confirm`         | 确认      |

已知最小字段：

```json
{
  "title": "开场",
  "content": "画面和对白描述",
  "durationSeconds": 5
}
```

### 7.2 当前阻塞

前端分镜模型还包含：

- 镜头顺序；
- 角色、场景、道具引用；
- 图片、视频和配音引用；
- 提示词和生成参数；
- 审核/确认状态；
- 隐藏、锁定等编辑状态；
- 图片编辑历史和参考图。

目前无法确认哪些字段应由后端持久化。仅保存 title/content/durationSeconds 会导致页面刷新后字段丢失。

### 7.3 后端需要交付

#### Workspace DTO

请提供：

- 项目和 Script/Storyboard 状态；
- `canGenerateStoryboard`；
- `canEnterCharacterDesign`；
- 完整 Storyboard 列表；
- 排序字段；
- revision/version；
- 资源引用；
- 媒体引用；
- 创建/更新时间。

#### CRUD DTO

请明确：

- 新增和更新的完整字段；
- PUT 全量或部分语义；
- 允许修改的字段；
- 删除是否幂等；
- 已确认分镜能否编辑；
- 生成任务进行中能否编辑；
- 引用不存在时的错误；
- 跨项目 storyboardId 行为。

#### Sort DTO

建议使用显式顺序：

```json
{
  "items": [
    {
      "storyboardId": "<id>",
      "sortOrder": 1
    }
  ],
  "expectedRevision": 3
}
```

也可使用 ID 数组，但需明确重复 ID、遗漏 ID、已删除 ID 和并发冲突的行为。

#### Confirm DTO

请明确：

- 是否要求至少一条分镜；
- 是否要求所有分镜完成审核；
- 是否要求图片已生成；
- Confirm 是否幂等；
- 确认后的状态和可进入下一步条件；
- 再编辑和取消确认策略。

### 7.4 验收条件

- 新增、更新、排序、删除后 Workspace 与列表一致；
- 刷新页面后领域字段不丢失；
- 排序结果稳定；
- 旧 revision 返回 409；
- 删除后详情/列表行为明确；
- Confirm 的前置条件和状态可复现；
- 低权限和跨项目访问返回稳定 403/404；
- 提供 Success/Empty/400/401/403/404/409 Fixture。

## 8. P0-04：真实业务生成与任务结果

### 8.1 当前已有任务控制

| Method | Path                                      | 当前状态          |
| ------ | ----------------------------------------- | ----------------- |
| GET    | `/admin-api/generation/tasks`             | REAL              |
| GET    | `/admin-api/generation/tasks/{id}`        | REAL              |
| POST   | `/admin-api/generation/tasks/{id}/cancel` | REAL              |
| POST   | `/admin-api/generation/tasks/{id}/retry`  | REAL              |
| POST   | `/admin-api/generation/tasks`             | CONTROLLED_REJECT |
| PATCH  | `/admin-api/generation/tasks/{id}`        | CONTROLLED_REJECT |

前端同意不直接创建通用任务、不直接修改任务状态。真实任务应由具体业务 Submit 创建，再通过通用任务接口查询。

### 8.2 需要后端确认的业务入口

现有文档包含：

- `POST /admin-api/aidrama/projects/{projectId}/script/generate`；
- `POST /admin-api/aidrama/assets/{assetId}/generate-image`；
- `POST /admin-api/aidrama/storyboards/{storyboardId}/generate-image`；
- `POST /admin-api/aidrama/storyboards/{storyboardId}/generate-video`；
- `POST /admin-api/aidrama/storyboards/{storyboardId}/generate-voice`。

当前这些入口包含 Mock、Sandbox 或占位结果。请确认哪些路径保留为真实业务入口，并为每个入口提供正式 Submit DTO。

### 8.3 Submit 公共要求

每个业务 Submit 至少支持：

- `projectId` 或从资源归属推导；
- 目标实体 ID；
- 模型/Provider 选择；
- 业务参数和生成参数；
- 可选参考媒体 ID；
- `requestId/idempotencyKey`；
- 参数校验；
- 权限和配额检查；
- 返回统一任务 ID。

建议响应：

```json
{
  "taskId": "<taskId>",
  "projectId": "<projectId>",
  "type": "STORYBOARD_IMAGE",
  "status": "QUEUED",
  "progress": 0,
  "target": {
    "entityType": "STORYBOARD",
    "entityId": "<storyboardId>"
  },
  "createTime": "2026-07-17T12:00:00+08:00"
}
```

### 8.4 Task DTO

请冻结：

- ID、projectId、type；
- `QUEUED/RUNNING/SUCCEEDED/FAILED/CANCELLED` 等状态枚举；
- 合法状态迁移；
- progress 范围；
- 当前阶段；
- target 实体；
- requestId/providerTaskId；
- result；
- errorCode/errorMessage/retryable；
- create/start/finish/update 时间；
- 取消和重试后的新旧任务关系。

任务结果优先返回轻量定位信息：

```json
{
  "mediaId": "<mediaId>",
  "url": "<remote-or-signed-url>",
  "entityId": "<asset-or-storyboard-id>",
  "mimeType": "image/png",
  "width": 1920,
  "height": 1080
}
```

任务完成后，相关 Workspace 也必须能读取到最新稳定媒体引用。

### 8.5 Provider 与 Callback

Provider Callback 是后端内部/受保护边界，不是普通前端接口。请后端负责：

- Callback 验签；
- 重放保护；
- providerTaskId 与内部 taskId 映射；
- 状态迁移校验；
- 重复 Callback 幂等；
- Provider 超时和失败映射；
- Sandbox 与生产 Provider 隔离。

### 8.6 验收条件

- 每个真实业务入口都返回可查询任务 ID；
- 重复 requestId 不产生重复计费任务；
- 状态从 QUEUED/RUNNING 到终态可复现；
- 取消、重试和不可取消状态有稳定响应；
- Provider 失败得到稳定 errorCode 和 retryable；
- 完成任务的媒体能在 Workspace 中恢复；
- 支持项目、状态、类型和更新时间筛选；
- 429 提供 Retry-After 或明确退避规则；
- 提供所有状态和错误 Fixture。

## 9. P0-05：Media Upload 与媒体生命周期

### 9.1 当前前端边界

前端已经区分：

| 类型     | 用途                       |
| -------- | -------------------------- |
| mediaId  | 跨会话稳定引用             |
| 远程 URL | CDN/后端访问地址           |
| Blob URL | 当前页面临时预览           |
| Data URL | 本地读取或 Mock 计算临时值 |

HTTP 模式不会将 Blob/Data URL 当成后端媒体。当前缺少正式上传端点。

### 9.2 后端需要定义的接口

后端可选择 multipart 上传或对象存储预签名直传，但至少提供等价能力：

1. 创建上传或直接上传；
2. 查询媒体元数据；
3. 获取/刷新访问 URL；
4. 删除媒体；
5. 查询处理状态（如扫描、转码）；
6. 业务实体关联媒体；
7. 孤儿媒体清理。

路径尚未确认，请后端在 OpenAPI 中正式定义，不要求沿用前端建议路径。

### 9.3 上传契约

请明确：

- 单文件、批量、分片；
- multipart 字段名；
- 最大文件大小；
- MIME、扩展名和内容嗅探；
- 图片尺寸；
- 音视频时长、编码和码率；
- 上传进度或分片完成；
- 哈希/秒传；
- 预签名有效期；
- 上传取消和重试；
- 同名文件行为；
- 租户和项目权限。

建议完成响应：

```json
{
  "mediaId": "<mediaId>",
  "fileName": "shot.png",
  "mimeType": "image/png",
  "size": 102400,
  "url": "<signed-or-stable-url>",
  "urlExpiresAt": "2026-07-17T13:00:00+08:00",
  "status": "READY",
  "width": 1920,
  "height": 1080,
  "createTime": "2026-07-17T12:00:00+08:00"
}
```

### 9.4 生命周期

请明确：

- URL 是永久地址还是签名地址；
- URL 过期前后的刷新方式；
- 删除是否检查引用计数；
- Project Asset、Storyboard、Resource 和任务结果如何引用 mediaId；
- 上传成功但业务保存失败时如何清理；
- Provider 产物是否自动登记为媒体；
- 媒体删除后 Workspace 如何表现；
- OSS/CDN CORS、Range、Content-Disposition 和缓存策略。

### 9.5 安全要求

- 服务端验证真实文件类型和大小；
- 文件名不能直接作为存储路径；
- 禁止返回长期对象存储密钥；
- 预签名 URL 权限和有效期可控；
- SVG/HTML/可执行内容有明确策略；
- 不允许跨租户访问；
- 下载/预览 Header 正确；
- 上传、刷新和删除有稳定 401/403/404/413/415/429 响应。

### 9.6 验收条件

- 上传图片、视频、音频各至少一份；
- 返回稳定 mediaId；
- 刷新页面后可通过 mediaId 恢复；
- URL 过期后可以刷新；
- 非法类型和超限文件被拒绝；
- 低权限和跨租户访问被拒绝；
- 被引用资源的删除行为符合文档；
- 孤儿资源可清理；
- 提供 Success/400/401/403/404/413/415/429/500 Fixture。

## 10. P0-06：真实 Export

### 10.1 已知前端路径

| Method | Path                                                        | 用途            |
| ------ | ----------------------------------------------------------- | --------------- |
| GET    | `/admin-api/aidrama/projects/{projectId}/exports/workspace` | 导出前检查      |
| POST   | `/admin-api/aidrama/projects/{projectId}/export`            | 创建导出任务    |
| GET    | `/admin-api/aidrama/projects/{projectId}/export/latest`     | 最新导出任务    |
| GET    | `/admin-api/aidrama/exports/{exportTaskId}/download-url`    | 下载地址        |
| GET    | `/admin-api/projects/{projectId}/export`                    | Phase1 兼容查询 |

当前结果属于 Mock/Placeholder，前端能力保持关闭。

### 10.2 后端需要交付

#### Export Workspace

至少返回：

- 项目是否可导出；
- 阻塞原因；
- 分镜总数；
- 缺少视频/音频/字幕的条目；
- 当前活跃导出任务；
- 最近成功任务；
- 可选格式和参数。

#### 创建任务

请明确：

- 输出格式；
- 分辨率、帧率、码率；
- 字幕；
- 音轨；
- 封面和文件名；
- 幂等/重复导出；
- 计费或配额；
- 前置条件。

#### Export Task

建议与 Generation Task 保持一致的任务状态模型，并增加：

- exportTaskId；
- projectId；
- status/progress/stage；
- output mediaId；
- fileName/mimeType/size/duration；
- errorCode/errorMessage/retryable；
- create/start/finish 时间；
- retentionExpiresAt。

#### 下载

下载接口需要明确：

- 返回 302、JSON URL 还是文件流；
- URL 有效期；
- 是否支持 Range；
- Content-Type；
- Content-Disposition；
- 跨域；
- 权限；
- 文件过期后的重新生成或重新签名。

### 10.3 验收条件

- 不满足前置条件时返回明确缺口列表；
- 创建任务后可查询进度和终态；
- 重复请求不会重复生成/计费；
- 实际下载文件非空、可打开；
- 音画、字幕、时长和格式符合参数；
- URL 过期行为可复现；
- 无权限用户无法下载他人产物；
- 取消、失败、重试和清理有稳定语义；
- 提供 Success/400/401/403/404/409/429/500 Fixture。

## 11. P1-01：认证、权限与生产 Session

请补充：

- 低权限账号和稳定 403 Fixture；
- 后端 Logout 接口或明确纯客户端退出；
- accessToken 过期时间；
- 是否提供 Refresh API；
- Refresh Token 轮换、并发刷新和重放保护；
- 服务重启后的 Session 行为；
- 多端登录和踢出策略；
- Profile permissions 的权限键清单；
- 生产 Cookie/CORS/CSRF 策略（如适用）。

验证码登录、注册、重置密码和社交登录已经有部分路径，但不在当前主交付范围。请明确本期 `OUT_OF_SCOPE` 或另行提供完整页面联调条件。

## 12. P1-02：Resource Library COPY 与权限

已知：

- Project Asset 保存到 Resource 使用 COPY Snapshot；
- Resource 导入 Project 也使用 COPY Snapshot；
- `scope` 支持 `PRIVATE/SYSTEM/SHARED`。

请补充：

- PRIVATE/SYSTEM/SHARED 的查看、创建、编辑、删除权限；
- save-to-library 和 import-from-library 的正式 Path/DTO；
- 重复复制行为；
- 来源资源 ID 是否保留；
- 一侧修改/删除后另一侧是否完全独立；
- SYSTEM/SHARED 审核流程；
- 跨租户行为；
- 403/404/409 Fixture。

## 13. P1-03：目录接口真实 Fixture

请为 Voices、Script Templates、Generation Tasks 提供：

- 正常分页；
- 空页；
- 关键词/状态过滤；
- 创建/更新/删除响应；
- 逻辑删除后行为；
- 400/401/403/404；
- 枚举；
- 时间格式；
- 低权限账号。

前端已有 Adapter，但缺少统一的真实成功/失败证据，暂不能把页面完整写流程标记为 verified。

## 14. P1-04：Project 完整语义

基础 CRUD 已验证，请补齐：

- Update 完整字段；
- status 枚举和合法迁移；
- PUT 全量/部分语义；
- revision/version 和 409；
- 删除后详情响应；
- 关联任务或媒体存在时的删除行为；
- batch-delete/copy/statistics/overview/tasks/pipeline 的当前范围；
- 低权限 403；
- 请求和响应时间字段。

## 15. P1-05：生产网络与可观测性

预发布前请提供：

- 正式域名和 HTTPS；
- Nginx/API 网关路径规则；
- CORS；
- 最大请求体；
- 上传、普通请求和长任务超时；
- requestId/traceId；
- 服务版本/commit 查询方式；
- 429 和 Retry-After；
- 日志检索所需的安全关联字段；
- 健康检查；
- Provider、对象存储和导出服务告警指标。

前端日志不得包含密码、Token、签名 URL 查询参数或用户原始内容。

## 16. P2：需要明确是否在本期范围

请对以下能力明确 `IMPLEMENTED`、`CONTROLLED_REJECT` 或 `OUT_OF_SCOPE`：

- Project Import；
- System styles/permissions 写入；
- 验证码登录、注册、重置密码、社交登录；
- System message 真正已读/清空；
- Project 扩展统计与 Pipeline；
- 剪映工程导出；
- 历史 legacy 路径；
- 通用 Generation Create/PATCH。

如果不在本期，请保留稳定错误码，避免返回表面成功但没有业务副作用。

## 17. 后端交付包

每个模块请提供一个可归档交付包：

### 17.1 契约

- OpenAPI JSON/YAML 或 Swagger 地址；
- Request DTO；
- Success Response DTO；
- Error DTO；
- 枚举；
- 状态机；
- 权限；
- 幂等；
- 版本/冲突；
- 分页和排序。

### 17.2 Fixture

- Success；
- Empty；
- Validation Error；
- 401；
- 403；
- 404；
- 409；
- 429；
- 500；
- 模块特有错误。

Fixture 必须脱敏，但不能删除影响解析的字段。

### 17.3 环境

- 环境别名；
- 后端 commit/版本；
- 部署时间；
- 测试账号；
- 低权限账号；
- 可安全创建和删除的数据范围；
- 是否允许自动化写验证；
- 清理规则；
- 已知限制。

### 17.4 变更说明

- 新增/修改/删除接口；
- 字段变化；
- 枚举变化；
- 兼容期；
- 废弃日期；
- 数据迁移；
- 前端需要同步的能力键。

## 18. 后端回复模板

后端可复制以下模板逐项回复：

```markdown
## <编号与模块>

- 状态：PLANNED | CONTRACT_READY | IMPLEMENTED | TESTABLE | VERIFIED | OUT_OF_SCOPE
- 负责人：
- 预计日期：
- 后端 commit：
- 环境：
- Method + Path：
- Request DTO：
- Success DTO：
- Empty DTO：
- Error DTO：
- 枚举：
- 权限：
- 幂等：
- revision/version：
- 分页/排序：
- 时间/时区：
- 写后读方式：
- Fixture 地址：
- 测试账号：
- 清理方式：
- 兼容/废弃说明：
- 已知限制：
```

## 19. 联调顺序

建议按最小闭环交付，不同时开放多个未验证能力：

```text
第一批：Script Content + Confirm
第二批：Project Asset 单实体 CRUD
第三批：Storyboard CRUD + sort + confirm
第四批：真实业务 Generation Submit + Task
第五批：Media Upload + mediaId 生命周期
第六批：Export + 真实下载
第七批：生产 Auth/权限/网络协议
```

每一批均执行：

1. 后端冻结 Contract；
2. 提供脱敏 Fixture；
3. 部署测试环境；
4. 前端实现 DTO/Mapper/Adapter；
5. 自动化测试；
6. 真实写后读；
7. 页面验收；
8. 更新接口矩阵；
9. 小范围开启 Capability；
10. 灰度和回滚验证。

## 20. 后端完成定义

一个 P0 模块只有同时满足以下条件才算可交付前端：

- [ ] OpenAPI/DTO 已冻结；
- [ ] Success/Empty/Error Fixture 齐全；
- [ ] 401/403/404 已验证；
- [ ] 409/429 等适用错误已验证；
- [ ] 写接口有可重复的写后读方法；
- [ ] 权限和租户隔离明确；
- [ ] 幂等、重试和冲突明确；
- [ ] 时间、ID、null 和枚举明确；
- [ ] 测试环境已部署；
- [ ] 提供可自动清理的测试数据；
- [ ] 提供后端 commit 和变更说明；
- [ ] 不使用 Mock/Placeholder 冒充真实结果；
- [ ] 前后端完成真实验收。

完成后，前端将按照 [后端接口接入执行手册](./backend-integration-runbook.md) 开始下一轮，并以 [接口矩阵](./endpoint-matrix.md) 更新最终状态。
