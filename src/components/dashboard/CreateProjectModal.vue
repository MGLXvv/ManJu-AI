<template>
  <Teleport to="body">
    <div v-if="open" class="create-project-modal">
      <div class="create-project-modal__overlay" @click="close"></div>

      <section class="create-project-modal__dialog" role="dialog" aria-modal="true" aria-label="新建项目设置">
        <header class="create-project-modal__header">
          <h2 class="create-project-modal__title">新建项目设置</h2>
          <button class="create-project-modal__close" type="button" aria-label="关闭" @click="close">×</button>
        </header>

        <form class="create-project-modal__body" @submit.prevent="submit">
          <label class="create-project-modal__field">
            <span class="create-project-modal__label">项目名称</span>
            <input
              v-model.trim="form.name"
              class="create-project-modal__input"
              type="text"
              placeholder="请输入项目名称"
            />
          </label>

          <div class="create-project-modal__field">
            <span class="create-project-modal__label">画面比例</span>

            <div class="create-project-modal__ratio-grid">
              <button
                type="button"
                class="create-project-modal__ratio"
                :class="{ 'is-active': form.ratio === '16:9' }"
                @click="form.ratio = '16:9'"
              >
                <span class="create-project-modal__ratio-icon create-project-modal__ratio-icon--landscape"></span>
                <span>横版16:9</span>
              </button>

              <button
                type="button"
                class="create-project-modal__ratio"
                :class="{ 'is-active': form.ratio === '9:16' }"
                @click="form.ratio = '9:16'"
              >
                <span class="create-project-modal__ratio-icon create-project-modal__ratio-icon--portrait"></span>
                <span>竖版 9:16</span>
              </button>
            </div>
          </div>

          <label class="create-project-modal__field">
            <span class="create-project-modal__label">整体风格</span>

            <div class="create-project-modal__select-wrap">
              <select v-model="form.style" class="create-project-modal__select">
                <option value="" disabled>请选择整体风格</option>
                <option value="国漫">国漫</option>
                <option value="写实">写实</option>
                <option value="古风">古风</option>
                <option value="二次元">二次元</option>
                <option value="赛博朋克">赛博朋克</option>
              </select>
            </div>
          </label>

          <button class="create-project-modal__submit" type="submit">创建项目</button>
        </form>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  (e: 'submit', payload: { name: string; ratio: '16:9' | '9:16'; style: string }): void
}>()

const form = reactive({
  name: '',
  ratio: '16:9' as '16:9' | '9:16',
  style: '',
})

watch(open, (value) => {
  if (value) {
    form.name = ''
    form.ratio = '16:9'
    form.style = ''
  }
})

const close = (): void => {
  open.value = false
}

const submit = (): void => {
  if (!form.name.trim()) {
    return
  }

  emit('submit', {
    name: form.name.trim(),
    ratio: form.ratio,
    style: form.style || '国漫',
  })
}
</script>
