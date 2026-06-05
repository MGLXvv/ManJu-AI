<template>
  <div class="script-empty-guide">
    <p class="script-empty-guide__hello">你好，导演</p>
    <p class="script-empty-guide__desc">输入你的创意、故事梗概，或者直接选择一个模板开始生成。</p>

    <div class="script-empty-guide__templates">
      <ScriptTemplateButton
        active
        title="AI生成故事动画"
        desc="从主题直接生成动画故事脚本"
        @click="
          $emit(
            'select-template',
            '请围绕一个奇幻冒险主题，生成适合 AI 动画制作的完整故事脚本，包含人物目标、冲突升级和结尾反转。',
          )
        "
      />
      <ScriptTemplateButton
        title="剧情短片"
        desc="输入主题后生成完整短片故事"
        @click="$emit('select-template', '请帮我生成一个 3 分钟剧情短片脚本，主题是友情、成长和冒险。')"
      />
      <ScriptTemplateButton
        title="角色设计"
        desc="根据角色设定生成角色小传"
        @click="$emit('select-template', '请设计一位适合国漫短剧的主角，包含性格、外貌、背景和成长目标。')"
      />
      <ScriptTemplateButton
        title="自由编辑"
        desc="润色、扩写或压缩已有文案"
        @click="$emit('select-template', '请帮我润色下面这段文案，使情节更紧凑，语言更适合短视频旁白。')"
      />
      <ScriptTemplateButton
        title="分镜预备"
        desc="为后续分镜生成准备结构化文本"
        @click="$emit('select-template', '请将故事拆分为适合分镜制作的镜头段落，每段包含画面、人物动作和旁白。')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ScriptTemplateButton from './ScriptTemplateButton.vue'

defineEmits<{
  (e: 'select-template', text: string): void
}>()
</script>
