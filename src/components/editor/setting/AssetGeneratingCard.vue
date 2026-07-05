<template>
  <div class="asset-generating-card">
    <span class="asset-generating-card__spinner" aria-hidden="true"></span>
    <span>{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
  }>(),
  {
    label: '角色生成中...',
  },
)
</script>

<style scoped>
.asset-generating-card__spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  flex: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  animation: asset-generating-card-spin 0.9s linear infinite;
  -webkit-mask:
    radial-gradient(circle, transparent 0 3px, #000 3px 7px, transparent 7px),
    repeating-conic-gradient(from -22.5deg, #000 0deg 12deg, transparent 12deg 45deg);
  -webkit-mask-composite: source-in;
  mask:
    radial-gradient(circle, transparent 0 3px, #000 3px 7px, transparent 7px),
    repeating-conic-gradient(from -22.5deg, #000 0deg 12deg, transparent 12deg 45deg);
  mask-composite: intersect;
}

@keyframes asset-generating-card-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
