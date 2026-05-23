<template>
  <section class="icon-library-page">
    <header class="icon-library-page__header">
      <h1>图标库</h1>
      <p>来源：Figma 导出 + <code>原型/ui/icon.png</code> 雪碧图</p>
    </header>

    <section v-for="group in iconGroups" :key="group.group" class="icon-library-group">
      <h2>{{ group.group }}</h2>
      <div class="icon-library-grid">
        <article v-for="name in group.icons" :key="name" class="icon-library-item">
          <FigmaIcon :name="name" :size="24" :title="iconMap[name].label" />
          <strong>{{ iconMap[name].label }}</strong>
          <small>{{ name }}</small>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import FigmaIcon from '@/components/icons/FigmaIcon.vue'
import { FIGMA_ICON_GROUPS, FIGMA_ICON_LIBRARY } from '@/components/icons/figmaIconLibrary'

const iconMap = FIGMA_ICON_LIBRARY
const iconGroups = FIGMA_ICON_GROUPS
</script>
