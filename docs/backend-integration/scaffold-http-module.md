# HTTP 模块脚手架使用说明

## 创建模块

```bash
pnpm scaffold:http-module <kebab-case-module-name>
```

预览但不写入：

```bash
pnpm scaffold:http-module <kebab-case-module-name> --dry-run
```

示例：

```bash
pnpm scaffold:http-module project-asset
```

## 生成文件

```text
src/api/modules/project-asset/
├─ project-asset.contract.ts
├─ project-asset.types.ts
├─ project-asset.mapper.ts
├─ project-asset.http.ts
├─ project-asset.mock.ts
├─ project-asset.api.ts
└─ index.ts
```

脚手架具有以下保护：

- 只接受 kebab-case 模块名；
- 不覆盖已有文件；
- 不生成猜测性的后端路径；
- HTTP Adapter 默认显式报未实现；
- Contract 默认 `UNKNOWN/not-started`；
- Mock 与 HTTP 保持相同 ApiContract。

## 接入步骤

### 1. 更新 Contract

在 `*.contract.ts` 中记录：

- Method；
- Path；
- Integration Pack / Phase1 / OpenAPI 来源；
- 后端状态：READY、REAL、MOCK、PARTIAL、CONTROLLED_REJECT 或 NO_OP；
- 前端证据：not-started、adapter-only、fixture-verified 或 live-verified；
- 后端 commit；
- 已知限制。

Contract 是审查元数据，不代替 DTO 和测试。

### 2. 定义前端 ApiContract

`*.types.ts` 面向页面业务，不复制后端 DTO。

```ts
export interface ExampleApiContract {
  list(query: ExampleQuery): Promise<PageResult<Example>>
  getById(id: string): Promise<Example | null>
}
```

### 3. 定义 Backend DTO 和 Mapper

后端字段只进入 Mapper：

```ts
export interface BackendExampleDTO {
  id?: string | number | null
  createTime?: string | null
}

export const mapBackendExample = (dto: BackendExampleDTO): Example => ({
  id: String(dto.id ?? ''),
})
```

### 4. 实现 HTTP Adapter

- 公共 Base URL 不重复写 `/admin-api`；
- READY/REAL 接口按文档路径实现；
- MOCK、CONTROLLED_REJECT 和 NO_OP 在注释中明确；
- 列表优先使用 `data.list/data.total`；
- 兼容字段只能放在 Mapper 或 shared helper；
- 不允许失败后回退 Mock。

### 5. 保存 Fixture

```text
tests/fixtures/http/<module>/success.json
tests/fixtures/http/<module>/empty.json
tests/fixtures/http/<module>/validation-error.json
tests/fixtures/http/<module>/unauthorized.json
tests/fixtures/http/<module>/forbidden.json
```

Fixture 必须脱敏。

### 6. 完成测试

至少覆盖：

- Method、Path、Query 和 Body；
- CommonResult 解包；
- DTO Mapper；
- 空数据；
- 业务错误；
- 401、403 和 404；
- 未知枚举；
- Mock 回归；
- Capability。

### 7. 真实环境验收

完成后将 Contract evidence 升级：

```text
not-started
-> adapter-only
-> fixture-verified
-> live-verified
```

只有真实页面、失败状态和刷新恢复均完成后，接口才可在交付文档中标记为前端完成。
