<template>
  <button class="app-button" :class="`app-button--${variant}`" :type="type">
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'primary' | 'ghost' | 'plain'; type?: 'button' | 'submit' }>(), {
  variant: 'plain',
  type: 'button',
})
</script>
