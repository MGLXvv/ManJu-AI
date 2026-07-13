# 真实项目 CRUD 联调

该流程验证第一条真实项目写链路：

```text
登录 → Profile → 创建临时项目 → 查询详情 → 重命名 → 再次查询 → 删除 → 列表确认不可见
```

脚本位于 `tools/integration/project-crud.mjs`。它不会在 CI 中访问真实后端，也不会读取仓库内的账号或密码。

## 安全约束

- 必须显式设置 `MANJU_ALLOW_WRITE=true` 才会执行写请求；
- Token 只保存在当前 Node 进程内，不写入报告；
- 报告会过滤 token、password、Authorization、Cookie 等敏感字段；
- 临时项目名称以 `frontend-contract-test-` 开头；
- 如果创建项目后任一步骤失败，脚本会在 `finally` 中尝试删除临时项目；
- 测试完成后仍应在项目列表中人工确认没有残留临时项目。

## Windows PowerShell

在已经连接 WireGuard、并确认可以访问 `10.10.3.26:48080` 的终端中执行：

```powershell
$credential = Get-Credential -UserName "admin" -Message "输入 ManJu 测试环境密码"

$env:MANJU_API_BASE_URL = "http://10.10.3.26:48080/admin-api"
$env:MANJU_USERNAME = $credential.UserName
$env:MANJU_PASSWORD = $credential.GetNetworkCredential().Password
$env:MANJU_ALLOW_WRITE = "true"

pnpm integration:project-crud

Remove-Item Env:MANJU_PASSWORD
Remove-Item Env:MANJU_USERNAME
Remove-Item Env:MANJU_ALLOW_WRITE
$credential = $null
```

不要把真实密码写入 `.env.integration.example`、GitHub Issue、PR、共享文本或 PowerShell 命令历史。

### 读取报告

Windows PowerShell 5.1 默认可能按照系统 ANSI 代码页读取无 BOM 的 UTF-8 文件。必须显式指定 UTF-8，否则中文 `msg` 可能乱码，并导致 `ConvertFrom-Json` 将原本有效的 JSON 误判为语法错误：

```powershell
$report = Get-Content .\artifacts\integration\project-crud-report.json -Raw -Encoding UTF8 |
  ConvertFrom-Json

$report | Select-Object generatedAt, success, baseUrl, error | Format-List
$report.steps |
  Select-Object name, method, endpoint, ok, httpStatus, code, msg, error |
  Format-Table -AutoSize
$report.project | Format-List
$report.cleanup | Format-List
```

PowerShell 7 通常默认使用 UTF-8，但仍建议保留 `-Encoding UTF8`，使命令在不同 Windows 环境中行为一致。

## Bash

```bash
MANJU_API_BASE_URL='http://10.10.3.26:48080/admin-api' \
MANJU_USERNAME='<测试账号>' \
MANJU_PASSWORD='<测试密码>' \
MANJU_ALLOW_WRITE='true' \
pnpm integration:project-crud
```

## 可选变量

| 变量                       | 默认值                              | 说明                         |
| -------------------------- | ----------------------------------- | ---------------------------- |
| `MANJU_API_BASE_URL`       | `http://10.10.3.26:48080/admin-api` | 必须包含 `/admin-api`        |
| `MANJU_REQUEST_TIMEOUT_MS` | `15000`                             | 单个请求超时，单位为毫秒     |
| `MANJU_ALLOW_WRITE`        | `false`                             | 必须为 `true` 才允许写入操作 |

## 输出

脚本生成以下本地文件，`artifacts/` 已被 Git 忽略：

```text
artifacts/integration/project-crud-report.json
artifacts/integration/project-crud-report.md
```

报告仅保留：

- 每一步的 HTTP 状态；
- CommonResult `code/msg`；
- `data` 的类型和字段名；
- 后端返回的 requestId/traceId Header；
- 临时项目 ID、名称和清理结果；
- 失败阶段及脱敏错误。

## 验收判断

完整通过应满足：

1. 登录和 Profile 返回 `code=0`；
2. 创建接口返回可解析的项目 ID；
3. 项目详情 ID 与创建结果一致；
4. 重命名后详情返回新名称；
5. 删除接口返回 `code=0`；
6. 使用唯一名称筛选列表时不再出现该项目；
7. 报告中不包含密码、Token、Cookie 或 Authorization Header。

脚本不修改项目状态。状态写入枚举需在后端明确后单独验证。
