# 通用接口协议

## CommonResult

所有业务接口使用：

```json
{
  "code": 0,
  "msg": "success",
  "data": {}
}
```

前端成功判断：

```text
HTTP 请求完成 && response.code === 0
```

业务错误可能仍使用 HTTP 200：

```json
{
  "code": 400,
  "msg": "错误原因",
  "data": null
}
```

当前共享响应拦截器已经支持 CommonResult 解包，并在 `code !== 0` 时抛出统一 `ApiError`；`code=401` 清理会话，`code=403` 标记无权限。

## 分页

确认的统一分页数据位于 `data`：

```json
{
  "list": [],
  "total": 0
}
```

请求参数通常为：

```text
pageNo
pageSize
keyword
status / type / scope（按模块可选）
```

Adapter 不得默认假设 `records`、`tasks`、`voices` 或 `templates` 是列表字段，除非真实响应 Fixture 已证明模块使用不同结构。

## ID、时间和空值

当前文档确认：

- 后端 ID 可能是数字，前端领域层统一转换为字符串；
- 时间字段常见为 `createTime`、`updateTime`；
- 当前文档没有冻结完整时间格式和时区，接入时必须使用真实 Fixture 验证；
- 删除接口多为逻辑删除；
- `extraJson` 是 JSON 字符串，不是对象；
- 空 `data`、NO_OP 接口和受控拒绝必须显式处理，不能直接读取 `data.message` 等深层字段。

## 认证和会话

账号密码登录请求：

```json
{
  "username": "<account>",
  "password": "<password>"
}
```

登录响应关键字段：

```json
{
  "userId": 1,
  "username": "<username>",
  "accessToken": "<opaque-token>",
  "refreshToken": "<opaque-refresh-token>",
  "tokenType": "Bearer"
}
```

规则：

- 统一使用 `username`，不在新代码中继续扩散 `account`；
- Header 使用 `Authorization: Bearer <accessToken>`；
- 当前没有 Refresh API；
- 服务重启导致 Token 失效时清理本地会话并回到登录页；
- `GET /system/auth/profile` 用于验证当前会话和恢复用户信息；
- 不记录密码、Token、Cookie 或完整 Authorization Header。

## 错误处理

| 场景 | 前端行为 |
|---|---|
| 业务 `code=400` | 显示后端 `msg`，保留安全错误码和 requestId |
| `code=401` / HTTP 401 | 清理会话并跳转登录 |
| `code=403` / HTTP 403 | 保留会话，显示无权限状态 |
| HTTP 404 | 记录 Method、URL、脱敏 Request、Response |
| HTTP/业务 500 | 保留发生时间、路径和安全诊断信息 |
| 网络失败 | 不切回 Mock，提供重试或恢复入口 |
| CONTROLLED_REJECT | 显示稳定的“当前阶段不可用”提示 |
| NO_OP_SUCCESS | 可更新本地 UI，但不得宣称真实业务已完成 |

## 枚举和前置条件

- Project Asset `type`：`CHARACTER`、`SCENE`、`PROP`；
- Resource `assetType`：`CHARACTER`、`SCENE`、`PROP`；
- Resource `scope`：`PRIVATE`、`SYSTEM`、`SHARED`；
- Script 状态：`DRAFT`、`SAVED`、`GENERATING`、`GENERATED`、`CONFIRMED`；
- Storyboard 状态主要为：`DRAFT`、`GENERATED`、`CONFIRMED`；
- 分镜生成要求 Script 已确认；
- 视频生成要求对应分镜已有图片；
- 导出要求所有未删除分镜已有视频。
