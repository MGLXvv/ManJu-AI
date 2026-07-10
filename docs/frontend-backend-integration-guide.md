# ManJu-AI 前端后端接口接入指南

## 1. 文档目的

本文面向后续负责 ManJu-AI 前后端联调的前端开发人员，说明真实接口到位后应如何配置、核对契约、修改 HTTP 适配层并完成验证。

当前原则是：页面、组件和 Pinia Store 不直接依赖后端 DTO，也不直接调用 Axios。真实接口差异应优先收敛在 `src/api/modules/*` 下的 HTTP 实现、类型和 Mapper 中。

## 2. 当前接口架构

标准业务模块通常采用以下结构：

```text
src/api/modules/<module>/
├─ <module>.api.ts       # 稳定入口，选择 mock 或 http
├─ <module>.http.ts      # 真实后端请求
├─ <module>.mock.ts      # 本地模拟实现
├─ <module>.types.ts     # 前端契约、后端 DTO 类型
├─ <module>.mapper.ts    # DTO 与前端领域模型转换（按需）
└─ index.ts
```

调用方向：

```text
Page / Component
  -> Pinia Store 或 Service
  -> <module>.api.ts
  -> mock implementation | HTTP implementation
  -> shared Axios client
```

禁止在页面中通过 `axios`、`fetch` 或 `http` 临时直连接口，否则会破坏 Mock/HTTP 切换和统一错误处理。

## 3. 联调环境配置

### 3.1 本地 Mock

```dotenv
VITE_API_MODE=mock
```

### 3.2 直连本地后端

```dotenv
VITE_API_MODE=http
VITE_API_BASE_URL=http://localhost:48080/admin-api
```

### 3.3 通过反向代理访问

```dotenv
VITE_API_MODE=http
```

未配置 `VITE_API_BASE_URL` 时，前端默认请求 `/admin-api`。

基础地址只包含后端网关前缀，不应包含 `/aidrama`、`/projects` 等业务路径。

## 4. 统一响应与鉴权约定

共享 Axios 客户端位于 `src/api/http.ts`，拦截器位于 `src/api/interceptors.ts`。

当前优先兼容以下响应：

```json
{
  "code": 0,
  "msg": "success",
  "data": {}
}
```

处理规则：

- `code === 0`：拦截器将 `response.data` 替换为内部的 `data`。
- `code !== 0`：抛出统一 `ApiError`。
- HTTP 状态或业务码为 `401`：清理登录会话。
- HTTP 状态或业务码为 `403`：标记无权限状态。
- 存在 Token 时自动发送 `Authorization: Bearer <token>`。

若后端响应结构不同，不要在每个页面单独解包。应先评估能否统一修改拦截器；只有某个业务模块特殊时，才在对应 `*.http.ts` 中适配。

## 5. 接口到位后的标准接入流程

### 第一步：获取并冻结接口契约

每个接口至少确认：

- HTTP Method 与完整业务路径
- Path、Query、Body 参数
- 请求 Content-Type
- 成功响应与错误响应示例
- ID 类型
- 枚举值及大小写
- 时间格式和时区
- 分页请求、分页返回结构
- 空值规则
- 文件上传和资源 URL 规则
- 是否需要幂等键

优先使用 Swagger/OpenAPI，并保存本次联调对应的接口版本或导出文件。

### 第二步：只修改模块 HTTP 层

找到对应文件：

```text
src/api/modules/<module>/<module>.http.ts
```

将后端请求写在该文件中，不改变对上层暴露的 `ApiContract`。

示例：

```ts
export const projectHttpApi: ProjectApiContract = {
  async getById(id) {
    const { data } = await http.get<BackendProjectDTO>(`/aidrama/projects/${id}`)
    return data ? mapBackendProjectToProject(data) : null
  },
}
```

### 第三步：通过 DTO 和 Mapper 隔离字段差异

后端 DTO 与前端领域对象不一致时，在 `*.types.ts` 定义 DTO，在 `*.mapper.ts` 转换。

```ts
export interface BackendProjectDTO {
  id: number
  name: string
  aspectRatio?: string
  createTime?: string
}
```

```ts
export const mapBackendProjectToProject = (dto: BackendProjectDTO): Project => ({
  id: String(dto.id),
  name: dto.name,
  ratio: dto.aspectRatio ?? '16:9',
  createdAt: normalizeBackendTime(dto.createTime),
})
```

不要为了匹配后端字段而直接修改大量组件所使用的前端模型。

### 第四步：更新或新增单元测试

HTTP 模块测试位于：

```text
tests/unit/api/modules/<module>/
```

测试至少覆盖：

- 请求 Method 和路径
- Query/Body Mapper
- 返回 DTO 转换
- 空数据行为
- 特殊错误行为
- 导入、导出、上传等非 CRUD 路径

### 第五步：切换 HTTP 模式验证

```bash
pnpm test
pnpm build
pnpm dev
```

在浏览器 Network 中检查：

- 请求 URL 是否重复出现 `/admin-api`
- 是否出现双斜杠
- Token 是否正确发送
- 请求体字段是否符合契约
- 响应是否已由拦截器解包
- 401/403 是否触发正确页面状态
- 页面是否仍存在 Mock 数据回退

## 6. 路径规范

当前默认网关前缀：

```text
/admin-api
```

AI 漫剧业务资源当前采用：

```text
/aidrama/...
```

项目资源统一为：

```text
GET    /aidrama/projects
POST   /aidrama/projects
GET    /aidrama/projects/:id
PUT    /aidrama/projects/:id
DELETE /aidrama/projects/:id
POST   /aidrama/projects/import
GET    /aidrama/projects/:id/export
```

最终浏览器请求示例：

```text
http://localhost:48080/admin-api/aidrama/projects
```

业务模块中的路径必须以 `/` 开头，但不能重复写 `/admin-api`。

错误示例：

```ts
http.get('/admin-api/aidrama/projects')
```

因为 Axios `baseURL` 已经包含 `/admin-api`。

## 7. 各模块推荐联调顺序

1. `auth`：登录、用户信息、退出与权限错误。
2. `project`：列表、详情、新建、修改、删除、导入导出。
3. `editor`：剧本草稿和编辑器工作区读取、保存。
4. 文件与媒体上传：图片、参考图、音频及资源 URL。
5. `generation`：异步任务创建、查询、取消、重试。
6. `setting`、`voice`：角色/场景/道具和声音资源。
7. `storyboard`：分镜 CRUD、参考图和编辑结果。
8. `video`、`dubbing`：长任务、媒体落库及组合流程。
9. `system`、`asset`、`scriptTemplate`：低优先级管理功能。

## 8. AI 生成任务接入要求

生成行为优先通过 `generation` 任务 API，不要分别在页面中实现轮询。

推荐生命周期：

```text
queued -> running -> success | failed | cancelled
```

前端服务层负责：

- 创建任务
- 轮询任务
- 校验任务结果
- 将稳定结果返回 Store

后端需要明确：

- 任务 ID
- 状态枚举
- `progress` 范围，建议 `0-100`
- 失败错误码和 `errorMessage`
- 结果结构
- 取消和重试语义
- 任务保存时长
- 是否改用 SSE/WebSocket

具体契约参见：

- `docs/generation-task-contract.md`
- `docs/backend-integration-checklist.md`

## 9. 文件上传接入检查

上传接口必须明确：

- `multipart/form-data` 字段名
- 单文件或多文件
- 文件大小和类型限制
- 上传进度是否必要
- 返回永久 URL、对象 Key 或临时 URL
- 临时 URL 的有效期
- 删除资源时是否同时删除对象存储文件
- 跨域和鉴权方式

建议后端返回稳定资源标识和可展示 URL，例如：

```json
{
  "id": "asset_123",
  "url": "https://cdn.example.com/path/image.png",
  "name": "image.png",
  "mimeType": "image/png",
  "size": 102400
}
```

## 10. 常见问题处理

### 请求仍然使用 Mock

检查：

```dotenv
VITE_API_MODE=http
```

修改 `.env.local` 后需重新启动 Vite。

### 请求地址出现重复前缀

错误：

```text
/admin-api/admin-api/aidrama/projects
```

原因通常是 `VITE_API_BASE_URL` 和模块路径都写了 `/admin-api`。业务模块应只写 `/aidrama/...`。

### 页面获得 `undefined`

先确认后端是否返回统一包装结构。如果拦截器已解包 `{ code, msg, data }`，HTTP 模块拿到的 `response.data` 已经是业务数据，不要再次读取 `.data`。

### 后端字段变化导致页面报错

优先更新 `Backend*DTO` 和 Mapper，并补测试，不要直接修改页面字段。

### HTTP 模式仍出现本地生成结果

搜索页面、Store 和 Service 是否直接引用：

- `*.mock.ts`
- `generateMock*`
- `localStorage` 业务辅助函数

真实生成流程应统一经过 generation service 和 generation API。

## 11. 提交前检查清单

- [ ] `VITE_API_MODE=mock` 时原有演示流程仍可运行
- [ ] `VITE_API_MODE=http` 时目标模块不调用 Mock
- [ ] 基础路径与业务路径没有重复
- [ ] 页面和 Store 未新增直接 HTTP 请求
- [ ] 后端 DTO 与前端模型通过 Mapper 隔离
- [ ] 请求、响应和错误场景已有单元测试
- [ ] `pnpm test` 通过
- [ ] `pnpm build` 通过
- [ ] 接口文档中的路径与代码一致
- [ ] 新增环境变量已记录在运行时配置文档中

## 12. 联调变更记录建议

每轮联调建议在 PR 描述中记录：

```text
后端接口版本/日期：
联调环境：
本次接入模块：
新增或修改接口：
DTO/枚举变化：
仍未确认项：
测试结果：
```

这样可以避免后端接口尚未稳定时，前端文档、测试和实现再次出现不同步。
