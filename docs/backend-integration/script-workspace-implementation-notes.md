# Script Workspace 实现边界

## 本轮完成

- HTTP 模式默认只加载 Script Workspace；
- Storyboard Workspace 只有显式请求对应分区时才加载；
- Storyboard 请求失败不再被吞掉并伪装为空数据；
- Script 保存只接受 `script` 分区；
- Setting、Storyboard、Video、Dubbing 和 Project Meta 写入在 Adapter 尚未完成时明确拒绝；
- 后端返回 `revision` 或 `version` 时映射到领域草稿；
- 后端未返回版本字段时保持当前 revision，不再由 HTTP Adapter 伪造自增版本；
- 新增可清理的真实 Script Workspace 联调脚本。

## 2026-07-14 首次真实验证

已确认：

- 登录、Profile、临时项目创建和 Script Workspace 初始加载成功；
- 初始 `scriptStatus=DRAFT`；
- `PUT /script/draft` 返回成功；
- 重新加载 Workspace 后，`rawText` 与 `prompt` 与写入标记一致；
- `PUT /script/content` 返回 `HTTP 200 + code=0`；
- 随后重新加载 Workspace 时，前端当前识别的 `content/scriptContent/generatedContent` 未回显写入标记；
- 验证器在进入 confirm 前按旧断言停止；
- 临时项目 `id=20` 已自动清理成功。

该结果不能证明 `/script/content` 写入失败，也不能证明生成稿已经持久化。当前只证明：写接口接受请求，但现有 Workspace 读契约无法按已知字段验证写入结果。

## 验证器修正

验证器已改为：

- 保存 `initial / afterDraft / afterContent / afterConfirm` 四阶段脱敏快照；
- 保存 draft/content/confirm 写接口的脱敏响应数据；
- 不再把“Workspace 必须回显生成稿”当成未经证实的硬契约；
- 结果分类为：
  - `PASS`：生成稿通过已知字段回读一致；
  - `PARTIAL`：写接口成功，但 Workspace 不提供已知生成稿字段；
  - `FAIL`：可观测字段存在但值不一致，或请求/清理失败；
- `PARTIAL` 继续执行 confirm、删除和缺失校验，以便一次运行收集完整证据。

## 当前限制

前端 Script 页面中的“剧本分镜文本”字段目前没有已确认的独立后端持久化字段。本轮只验证已确认的：

```text
rawText
prompt
content / scriptContent / generatedContent
scriptStatus
canEnterStoryboard
updateTime / updatedAt
revision / version（存在时）
```

在后端明确剧本分镜文本的存储接口或字段之前，不把该字段猜测性写入 Script Content 或 Storyboard Workspace。

## revision 与 409

当前后端文档没有确认 Script Workspace 并发版本字段和 409 请求格式。前端保留现有冲突状态机制，但本轮不构造虚假 `expectedRevision` 请求字段，也不声称真实 409 已完成。

后续需要确认：

- Workspace 是否返回 `revision` 或 `version`；
- 保存接口如何携带期望版本；
- 冲突返回使用 HTTP 409 还是 CommonResult 业务 code；
- 覆盖保存是否存在独立参数或接口。

## PR #33 合并条件

1. 增强后的真实验证完成；
2. 确认 `/script/content` 是通过 Workspace 字段回读、独立端点读取，还是仅供后续流程内部消费；
3. 若结果为 `PARTIAL`，在 PR 和 Issue #14 中明确记录后端契约缺口，不把生成稿持久化标为 verified；
4. 自动 CI、Mock E2E 和视觉回归保持通过。
