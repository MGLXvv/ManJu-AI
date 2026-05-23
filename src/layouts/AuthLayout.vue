<template>
  <div class="auth-layout">
    <header class="auth-layout__header">
      <RouterLink class="auth-layout__brand" to="/">
        <span class="auth-layout__brand-glow">ManJu AI</span>
        <span class="auth-layout__brand-text">ManJu AI</span>
      </RouterLink>
      <button class="auth-layout__lang" type="button">
        <span>简体中文</span>
        <span class="auth-layout__lang-arrow">▾</span>
      </button>
    </header>
    <main class="auth-layout__body">
      <RouterView />
    </main>
  </div>
</template>
