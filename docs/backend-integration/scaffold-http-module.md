# HTTP 模块脚手架命令

## 用途

当后端提供一个新模块契约时，可以先生成标准前端目录，再填写真实 Contract、DTO、Mapper、Adapter、Fixture 和测试。

命令：

```bash
pnpm scaffold:http-module <kebab-case-module-name>
```

示例：

```bash
pnpm scaffold:http-module resource-folder
```

生成：

```text
src/api/modules/resource-folder/
├─ resource-folder.api.ts
├─ resource-folder.http.ts
├─ resource-folder.mock.ts
├─ resource-folder.types.ts
├─ resource-folder.mapper.ts
└─ index.ts
```

## 安全设计

脚手架不会猜测后端接口：

- HTTP Adapter 默认抛出 `<MODULE>_HTTP_CONTRACT_NOT_IMPLEMENTED`；
- 不生成虚假的请求路径；
- 不把 Mock 数据作为 HTTP 回退；
- 不自动修改 Capability；
- 不覆盖任何已存在的目标文件；
- 模块名只允许小写 kebab-case；
- `--dry-run` 可以只查看将创建的文件。

预览：

```bash
pnpm scaffold:http-module resource-folder --dry-run
```

## 生成后必须完成

1. 阅读 [`interface-readiness.md`](./interface-readiness.md)，确认接口属于 `CONTRACT_READY`、`LIVE_PARTIAL` 还是 `LIVE_VERIFIED`；
2. 在 `*.types.ts` 定义前端稳定 Contract；
3. 在 `*.mapper.ts` 定义 nullable 后端 DTO 和纯 Mapper；
4. 在 `*.http.ts` 填写已确认的 Method、Path、Query 和 Body；
5. 在 `*.mock.ts` 保持与 HTTP 相同的前端 Contract；
6. 为未验证、只读、Mock、NO_OP 或稳定拒绝能力更新 Capability；
7. 保存脱敏 Fixture；
8. 添加 Mapper、Adapter 和错误场景测试；
9. 写接口执行写后重新读取和自动清理；
10. 更新接口成熟度矩阵和验证记录。

详细模板见 [`http-module-template.md`](./http-module-template.md)，完整流程见 [`frontend-adapter-playbook.md`](./frontend-adapter-playbook.md)。

## 不适用场景

以下情况不要通过脚手架直接开始写请求：

- 后端只有口头描述，没有 Method、Path 和 DTO；
- 接口是 `CONTROLLED_REJECT`；
- 接口是 `NO_OP`，但产品要求真实业务效果；
- 接口依赖尚未完成的 Image、Video、TTS 或 Export 算法链路；
- 上传协议和媒体生命周期尚未冻结；
- 同一领域已有 Adapter，只是需要增加一个方法。

这些情况应先更新现有 Contract、Capability 或等待后端契约，而不是创建重复模块。
