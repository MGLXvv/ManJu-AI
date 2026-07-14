# 真实 Script Workspace 验证

该流程在 WireGuard 测试环境中验证 Script Workspace 的真实读取和持久化契约。

## 验证范围

```text
login
-> profile
-> create temporary project
-> load initial Script Workspace
-> save rawText and prompt
-> reload and compare
-> save generated content
-> reload and compare
-> confirm Script
-> reload confirmed workspace
-> delete temporary project
-> verify project is absent
```

该脚本不会调用 Script 生成模型，也不会修改已有项目。

## 安全约束

- 必须显式设置 `MANJU_ALLOW_WRITE=true`；
- 账号、密码和 Token 只存在于当前 Node 进程；
- 报告不会保存密码、Token、Authorization Header、Cookie 或其他敏感字段；
- 创建临时项目后发生任意失败，脚本都会在 `finally` 中尝试删除该项目；
- CI 只运行假后端单元测试，不访问真实测试环境。

## PowerShell

```powershell
$credential = Get-Credential `
  -UserName "admin" `
  -Message "输入 ManJu 测试环境密码"

$env:MANJU_API_BASE_URL = "http://10.10.3.26:48080/admin-api"
$env:MANJU_USERNAME = $credential.UserName
$env:MANJU_PASSWORD = $credential.GetNetworkCredential().Password
$env:MANJU_ALLOW_WRITE = "true"

pnpm integration:script-workspace
```

完成后清理：

```powershell
Remove-Item Env:MANJU_PASSWORD -ErrorAction SilentlyContinue
Remove-Item Env:MANJU_USERNAME -ErrorAction SilentlyContinue
Remove-Item Env:MANJU_ALLOW_WRITE -ErrorAction SilentlyContinue
Remove-Item Env:MANJU_API_BASE_URL -ErrorAction SilentlyContinue
$credential = $null
```

成功输出：

```text
Script Workspace verification: PASS
Report: artifacts/integration/script-workspace-report.json
```

## 报告

```text
artifacts/integration/script-workspace-report.json
artifacts/integration/script-workspace-report.md
```

Windows PowerShell 5.1 读取 JSON 时必须指定 UTF-8：

```powershell
$report = Get-Content .\artifacts\integration\script-workspace-report.json `
  -Raw `
  -Encoding UTF8 |
  ConvertFrom-Json

$report.steps |
  Select-Object name, method, endpoint, ok, httpStatus, code, msg, error |
  Format-Table -AutoSize

$report.workspace | Format-List
$report.cleanup | Format-List
```

## 当前 revision 结论

前端只在后端响应实际提供 `revision` 或 `version` 时采用该值。后端没有返回并发版本字段时，前端不会继续伪造自增 revision。

因此真实 409/revision conflict 仍属于待确认契约，不在本次验证中模拟。
