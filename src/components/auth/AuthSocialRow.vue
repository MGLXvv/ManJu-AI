<template>
  <div class="auth-social">
    <div class="auth-social__divider">
      <span></span>
      <em>或者</em>
      <span></span>
    </div>
    <div class="auth-social__buttons">
      <button v-for="item in items" :key="item.label" type="button" class="auth-social__button" :title="item.label">
        <FigmaIcon v-if="item.type === 'icon'" :name="item.name" :size="22" />
        <span v-else class="auth-social__text-icon" aria-hidden="true">{{ item.text }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import type { FigmaIconName } from '@/components/icons/figmaIconLibrary'

const items: Array<
  | { type: 'icon'; name: FigmaIconName; label: string }
  | { type: 'text'; text: string; label: string }
> = [
  { type: 'icon', name: 'social-wechat', label: '微信登录' },
  { type: 'icon', name: 'social-qq', label: 'QQ登录' },
  { type: 'text', text: '支', label: '支付宝登录' },
]
</script>
