<template>
  <Teleport to="body">
    <Transition name="storyboard-image-dialog">
      <div v-if="open" class="storyboard-image-dialog__mask" @click="emit('close')">
        <section class="storyboard-image-dialog" role="dialog" aria-modal="true" @click.stop>
          <header class="storyboard-image-dialog__header">
            <div>
              <h3>{{ title }}</h3>
              <p>{{ zoomMode ? '查看放大后的分镜图细节' : '查看当前分镜图' }}</p>
            </div>
            <div class="storyboard-image-dialog__tools">
              <button type="button" aria-label="缩小" @click="zoomOut">-</button>
              <button type="button" aria-label="重置缩放" @click="resetScale">100%</button>
              <button type="button" aria-label="放大" @click="zoomIn">+</button>
              <button type="button" class="is-close" aria-label="关闭" @click="emit('close')">×</button>
            </div>
          </header>

          <div class="storyboard-image-dialog__stage">
            <img v-if="imageUrl" :src="imageUrl" :alt="title" :style="imageStyle" />
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    imageUrl: string
    title: string
    zoomMode?: boolean
  }>(),
  {
    zoomMode: false,
  },
)

const emit = defineEmits<{
  (event: 'close'): void
}>()

const scale = ref(1)

const resetScale = (): void => {
  scale.value = props.zoomMode ? 1.35 : 1
}

watch(
  () => [props.open, props.zoomMode],
  () => {
    resetScale()
  },
  { immediate: true },
)

const zoomIn = (): void => {
  scale.value = Math.min(scale.value + 0.2, 3)
}

const zoomOut = (): void => {
  scale.value = Math.max(scale.value - 0.2, 0.6)
}

const imageStyle = computed(() => ({
  transform: `scale(${scale.value})`,
}))
</script>
