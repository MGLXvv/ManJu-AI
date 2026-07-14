# Script Workspace 实现边界

## 本轮完成

- HTTP 模式默认只加载 Script Workspace；
- Storyboard Workspace 只有显式请求对应分区时才加载；
- Storyboard 请求失败不再被吞掉并伪装为空数据；
- Script 保存只接受 `script` 分区；
- Setting、Storyboard、Video、Dubbing 和 Project Meta 写入在 Adapter 尚未完成时明确拒绝；
- 后端返回 `revision` 或 `version` 时映射到领域草稿；
- 后端未返回版本字段时保持当前 revision，不再由 HTTP Adapter伪造自增版本；
- 新增可清理的真实 Script Workspace 联调脚本。

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
