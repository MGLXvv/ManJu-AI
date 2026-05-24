<template>
  <div class="script-empty-guide">
    <p class="script-empty-guide__hello">嗨~导演！</p>
    <p class="script-empty-guide__desc">告诉我你的创意 idea 吧！或者试试我们的功能：</p>

    <div class="script-empty-guide__templates">
      <ScriptTemplateButton
        active
        title="AI生成故事动画"
        desc="从主题直接生成动画脚本"
        @click="
          $emit(
            'select-template',
            '请围绕一个奇幻冒险主题，生成适合AI动画制作的完整故事脚本，包含人物目标、冲突升级和结尾反转。',
          )
        "
      />
      <ScriptTemplateButton
        title="剧情故事短片"
        desc="输入故事主题，生成完整短片文案"
        @click="$emit('select-template', '请帮我生成一个3分钟剧情故事短片，主题是友情、成长和冒险。')"
      />
      <ScriptTemplateButton
        title="角色设计"
        desc="根据人物设定生成角色小传"
        @click="$emit('select-template', '请设计一位适合国漫短剧的主角，包括性格、外貌、背景和成长目标。')"
      />
      <ScriptTemplateButton
        title="自由编辑"
        desc="润色、扩写或压缩已有文案"
        @click="$emit('select-template', '请帮我润色下面这段文案，使情节更紧凑，语言更适合短视频旁白。')"
      />
      <ScriptTemplateButton
        title="分镜自由"
        desc="为后续分镜生成准备结构化文本"
        @click="$emit('select-template', '请将故事拆分为适合分镜制作的镜头段落，每段包含画面、人物动作和旁白。')"
      />
    </div>

    <button class="script-empty-guide__manual-btn" type="button" @click="$emit('manual-edit')">
      手动输入文案
    </button>
  </div>
</template>

<script setup lang="ts">
import ScriptTemplateButton from './ScriptTemplateButton.vue'

defineEmits<{
  (e: 'select-template', text: string): void
  (e: 'manual-edit'): void
}>()
</script>
