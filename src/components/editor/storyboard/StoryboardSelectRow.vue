<template>
  <div class="storyboard-select-row">
    <label class="storyboard-select-row__item">
      <span>图像风格</span>
      <select :value="style" @change="$emit('update:style', ($event.target as HTMLSelectElement).value)">
        <option v-for="item in styles" :key="item" :value="item">{{ item }}</option>
      </select>
    </label>

    <label class="storyboard-select-row__item">
      <span>画幅比例</span>
      <select :value="ratio" @change="$emit('update:ratio', ($event.target as HTMLSelectElement).value as '16:9' | '9:16')">
        <option value="16:9">16:9</option>
        <option value="9:16">9:16</option>
      </select>
    </label>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  style: string
  styles: string[]
  ratio: '16:9' | '9:16'
}>()

defineEmits<{
  (e: 'update:style', value: string): void
  (e: 'update:ratio', value: '16:9' | '9:16'): void
}>()
</script>
