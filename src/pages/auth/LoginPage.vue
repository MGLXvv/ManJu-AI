<template>
  <section class="login-page">
    <div class="login-page__art" aria-hidden="true">AI 漫剧创作平台</div>
    <form class="login-page__panel">
      <h1>账号登录</h1>
      <input placeholder="手机号/邮箱/用户名" />
      <input placeholder="密码" type="password" />
      <AppButton variant="primary">登录</AppButton>
      <p>验证码登录 / 第三方登录 / 注册入口后续补充</p>
    </form>
  </section>
</template>

<script setup lang="ts">
import AppButton from '@/components/app/AppButton.vue'
</script>
