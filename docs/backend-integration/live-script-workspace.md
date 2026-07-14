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
-> reload and inspect
-> confirm Script
-> reload confirmed workspace
-> delete temporary project
-> verify project is absent
```

该脚本不会调用 Script 生成模型，也不会修改已有项目。

## 结果分类

脚本区分三种结果：

- `PASS`：草稿字段、生成稿字段和确认流程均可通过 Workspace 回读验证；
- `PARTIAL`：写接口成功，但 Workspace 未提供 `content`、`scriptContent` 或 `generatedContent`，生成稿持久化无法通过当前读接口证明；
- `FAIL`：请求失败、草稿回读不一致、生成稿存在可观测字段但值不一致，或清理失败。

`PARTIAL` 不代表生成稿写入失败，只代表当前读契约无法观察该结果。报告会保存临时项目各阶段的脱敏 Workspace 快照和写接口响应数据，用于与后端确认真实字段或补充读取端点。

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

完整验证输出：

```text
Script Workspace verification: PASS
Report: artifacts/integration/script-workspace-report.json
```

读契约尚不能观察生成稿时：

```text
Script Workspace verification: PARTIAL
Report: artifacts/integration/script-workspace-report.json
```

`PARTIAL` 会以成功进程状态结束，避免被 pnpm 误报为脚本崩溃；是否可以合并仍由报告中的 `generatedContentVerification` 和后端契约确认决定。

## 报告

```text
artifacts/integration/script-workspace-report.json
artifacts/integration/script-workspace-report.md
```

报告中的关键字段：

```text
outcome
workspace.snapshots.initial
workspace.snapshots.afterDraft
workspace.snapshots.afterContent
workspace.snapshots.afterConfirm
workspace.writeResponses
workspace.generatedContentVerification
cleanup
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

$report.workspace.generatedContentVerification | Format-List *
$report.workspace.snapshots | ConvertTo-Json -Depth 12
$report.workspace.writeResponses | ConvertTo-Json -Depth 8
$report.cleanup | Format-List
```

## 2026-07-14 首次真实运行结论

首次运行已确认：

- 登录、Profile 和临时项目创建成功；
- `GET /script/workspace` 初始状态为 `DRAFT`；
- `PUT /script/draft` 成功，`rawText` 和 `prompt` 可重新读取；
- `PUT /script/content` 返回 `code=0`；
- 随后的 Workspace 未通过前端当前已知字段回显生成稿；
- 临时项目已由自动清理成功删除。

因此当前不能把生成稿持久化标记为已验证。需要通过增强后的脱敏快照确认 Workspace 实际字段，或由后端提供生成稿读取端点/字段说明。

## 当前 revision 结论

前端只在后端响应实际提供 `revision` 或 `version` 时采用该值。后端没有返回并发版本字段时，前端不会继续伪造自增 revision。

因此真实 409/revision conflict 仍属于待确认契约，不在本次验证中模拟。
