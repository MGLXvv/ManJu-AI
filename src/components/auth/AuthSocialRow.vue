<template>
  <div class="auth-social">
    <div class="auth-social__divider">
      <span></span>
      <em>或者</em>
      <span></span>
    </div>
    <div class="auth-social__buttons">
      <button v-for="item in items" :key="item.name" type="button" class="auth-social__button" :title="item.label">
        <FigmaIcon :name="item.name" :size="22" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import type { FigmaIconName } from '@/components/icons/figmaIconLibrary'

const items: Array<{ name: FigmaIconName; label: string }> = [
  { name: 'auth-social-wechat', label: '微信登录' },
  { name: 'auth-social-qq', label: 'QQ登录' },
  { name: 'auth-social-alipay', label: '支付宝登录' },
]
</script>
