# 后端原始联调资料归档

本目录保存后端交付给前端的原始联调文档，作为接口状态、Method/Path、阶段限制和后端版本的历史依据。

## 文件

- [`frontend-integration-pack.md`](./frontend-integration-pack.md)：后端测试环境、通用协议、核心业务接口、READY/PARTIAL 状态和完整推荐联调顺序；
- [`frontend-phase1-update.md`](./frontend-phase1-update.md)：Frontend API Compat Phase1 增量接口和特殊状态说明。

## 来源与版本

- 后端仓库：`manju-ai-server`；
- Integration Pack：以后端当时 `dev` 分支和测试环境为准；
- Phase1 部署 commit：`646a302 feat: add frontend api compatibility phase1`；
- 后续部署脚本修复：`a53d8ff chore: fix deployment pid management`，不改变业务 API；
- 测试环境：`http://10.10.3.26:48080`，通过 WireGuard 访问；
- 归档日期：2026-07-14。

## 使用原则

1. 本目录保存原始输入，不随前端实现推测性修改；
2. 当前前端结论以 [`../endpoint-matrix.md`](../endpoint-matrix.md) 为准；
3. 后端 `READY` 只表示真实业务接口已实现，不代表完整 AI、媒体或导出流程完成；
4. 接口是否可在正式页面启用，还需要 Adapter、Mapper、Fixture、错误链和真实写后读证据；
5. 若原始文档与后续 OpenAPI、后端 DTO 或真实响应冲突，以更新且更高优先级的证据为准。
