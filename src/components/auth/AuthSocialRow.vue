<template>
  <div class="auth-social">
    <div class="auth-social__divider">
      <span></span>
      <em>或者</em>
      <span></span>
    </div>
    <div class="auth-social__buttons">
      <button
        v-for="item in items"
        :key="item.label"
        type="button"
        class="auth-social__button" :class="`auth-social__button--${item.provider}`"
        :title="item.label"
        @click="$emit('select', item.provider)"
      >
        <FigmaIcon v-if="item.type === 'icon'" class="auth-social__glyph" :name="item.name" :size="56" />
        <svg
          v-else
          class="auth-social__alipay"
          width="30"
          height="30"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M19.4224 13.3576C15.5929 12.2048 13.3667 11.5176 12.744 11.296C13.312 10.32 13.768 9.2 14.064 7.976H10.8V6.872H14.8V6.192H10.8V4.344H9.264C8.984 4.344 8.952 4.592 8.952 4.592V6.184H5.2V6.864H8.952V7.968H5.88V8.584H12.104C11.88 9.36 11.576 10.096 11.216 10.76C9.808 10.296 9.024 9.976 7.304 9.816C4.048 9.504 3.296 11.296 3.176 12.392C3 14.064 4.48 15.424 6.688 15.424C8.896 15.424 10.368 14.4 11.768 12.704C12.9346 13.2619 15.1059 14.2293 18.2819 15.6062C16.4835 18.2577 13.4452 20 10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10C20 11.1778 19.7964 12.3081 19.4224 13.3576ZM6.432 14.368C4.096 14.368 3.728 12.888 3.848 12.272C3.968 11.656 4.648 10.856 5.952 10.856C7.448 10.856 8.784 11.24 10.392 12.016C9.256 13.496 7.872 14.368 6.432 14.368Z"
            fill="white"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import type { FigmaIconName } from '@/components/icons/figmaIconLibrary'
import type { ThirdPartyProvider } from '@/types/auth'

defineEmits<{
  (e: 'select', value: ThirdPartyProvider): void
}>()

const items: Array<
  | { type: 'icon'; name: FigmaIconName; label: string; provider: ThirdPartyProvider }
  | { type: 'alipay'; label: string; provider: ThirdPartyProvider }
> = [
  { type: 'icon', name: 'social-wechat', label: '微信登录', provider: 'wechat' },
  { type: 'icon', name: 'social-qq', label: 'QQ登录', provider: 'qq' },
  { type: 'alipay', label: '支付宝登录', provider: 'alipay' },
]
</script>



