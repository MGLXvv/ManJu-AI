# 真实联调验证记录

## 2026-07-13：Auth Profile 与 Project 读取契约

来源：后端测试环境的已脱敏真实响应，由联调人员提供。前端 CI 无法访问 WireGuard 内网，因此本记录不声明 CI 已直接请求测试服务器。

### 已确认

- 存在可用的管理权限联调账号；账号凭据仅在团队安全渠道保存，不进入仓库；
- `GET /admin-api/system/auth/profile` 返回 `userId`、`username`、`nickname`、`roles` 和 `permissions`；
- 当前账号后端角色为 `super_admin`；
- 已确认项目读写、分镜读取和任务读取等权限字段；
- `GET /admin-api/aidrama/projects` 的分页数据使用 `data.list` 与 `data.total`；
- `GET /admin-api/aidrama/projects/{projectId}` 返回单个项目 DTO；
- 项目状态样例包含 `DRAFT`，前端映射为进行中并从 `script` 步骤进入；
- 时间样例为 `2026-07-04T07:52:49`，没有时区偏移信息；
- 当前样例响应中没有 `requestId` 或 `traceId` 字段。

### 已保存 Fixture

- `tests/fixtures/http/auth-profile.success.json`；
- `tests/fixtures/http/project-list.success.json`；
- `tests/fixtures/http/project-detail.success.json`。

Fixture 不包含密码、Access Token、Refresh Token、Cookie 或完整 Authorization Header。

### 尚未执行

- `POST /admin-api/aidrama/projects`：为避免产生测试数据，本轮未实际调用；
- 项目更新和删除的真实环境验收；
- 401、403、业务 `code=400` 和服务异常响应采集；
- Health 与完整登录链路的本工具环境直连验证；
- 时间字段的实际时区约定；
- requestId/traceId 的来源和 Header 名称。

### 后续安全执行建议

真实创建项目时使用带日期和操作者标识的临时名称，完成详情、更新和删除验证后立即清理。测试账号密码、Token 和服务器私有访问配置不得写入 Git、Issue、PR、CI 日志或浏览器控制台。
