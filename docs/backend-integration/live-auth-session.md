# 真实认证会话联调

该流程验证认证成功、Profile 校验和失效 Token 处理：

```text
登录 → 有效 Token 查询 Profile → 故意破坏 Token → Profile 返回 401
```

脚本位于 `tools/integration/auth-session.mjs`。它只读取认证接口，不创建、修改或删除任何业务数据。

## Windows PowerShell

在已连接 WireGuard 的终端中执行：

```powershell
$credential = Get-Credential -UserName "admin" -Message "输入测试环境密码"

$env:MANJU_API_BASE_URL = "http://10.10.3.26:48080/admin-api"
$env:MANJU_USERNAME = $credential.UserName
$env:MANJU_PASSWORD = $credential.GetNetworkCredential().Password

pnpm integration:auth-session

Remove-Item Env:MANJU_PASSWORD -ErrorAction SilentlyContinue
Remove-Item Env:MANJU_USERNAME -ErrorAction SilentlyContinue
Remove-Item Env:MANJU_API_BASE_URL -ErrorAction SilentlyContinue
$credential = $null
```

成功时输出：

```text
Auth session verification: PASS
Report: artifacts/integration/auth-session-report.json
```

## 输出与脱敏

脚本生成：

```text
artifacts/integration/auth-session-report.json
artifacts/integration/auth-session-report.md
```

报告不保存密码、Access Token、Authorization Header 或 Cookie，仅记录：

- HTTP Status；
- CommonResult `code/msg`；
- `data` 类型和字段名；
- requestId/traceId Header；
- 每一步是否符合预期。

Windows PowerShell 5.1 读取 JSON 时必须显式指定 UTF-8：

```powershell
$report = Get-Content .\artifacts\integration\auth-session-report.json -Raw -Encoding UTF8 |
    ConvertFrom-Json

$report.steps |
    Select-Object name, method, endpoint, ok, httpStatus, code, msg |
    Format-Table -AutoSize
```

## 验收标准

完整通过应满足：

1. 登录返回 `code=0`，且响应中存在可用的不透明 Token；
2. 使用有效 Token 查询 Profile 返回 `code=0`；
3. 使用故意破坏的 Token 查询 Profile 返回 HTTP 401 或 CommonResult `code=401`；
4. 报告不包含密码、Token、Cookie 或 Authorization Header；
5. 前端启动时遇到失效 Token 会清理本地 Session，并带 `reason=expired` 跳转登录页；
6. 应用运行中收到 401 会立即跳转登录页并显示“登录状态已失效”；
7. 403 不清理登录态，仅显示权限不足提示。

低权限账号的真实 403 仍需单独账号支持后完成。
