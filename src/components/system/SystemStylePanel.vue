<template>
  <section class="system-style-panel">
    <header class="system-panel-head">
      <div class="system-style-panel__search">
        <input
          :value="search"
          class="system-style-panel__search-input"
          type="text"
          placeholder="请输入名称"
          @input="onSearch"
        />
      </div>
      <button v-if="!creating" type="button" class="system-page__primary" @click="startCreate">新增风格</button>
    </header>

    <div class="system-table-shell">
      <div class="system-table system-table--styles">
        <div class="system-table__head">
          <div>序号</div>
          <div>风格名称</div>
          <div>风格分类</div>
          <div>风格描述</div>
          <div>操作</div>
        </div>

        <div v-if="creating" class="system-table__row is-editing">
          <div>{{ items.length + 1 }}</div>
          <div><input v-model="draft.name" class="system-table__input" type="text" placeholder="输入风格名称" /></div>
          <div>
            <input v-model="draft.category" class="system-table__input" type="text" placeholder="输入风格分类" />
          </div>
          <div>
            <textarea v-model="draft.prompt" class="system-table__textarea" placeholder="输入风格描述"></textarea>
          </div>
          <div class="system-table__actions">
            <button type="button" class="is-primary" @click="saveCreate">保存</button>
            <button type="button" @click="cancelEdit">取消</button>
          </div>
        </div>

        <div
          v-for="(item, index) in items"
          :key="item.id"
          class="system-table__row"
          :class="{ 'is-editing': editingId === item.id }"
        >
          <template v-if="editingId === item.id">
            <div>{{ index + 1 }}</div>
            <div><input v-model="draft.name" class="system-table__input" type="text" placeholder="输入风格名称" /></div>
            <div>
              <input v-model="draft.category" class="system-table__input" type="text" placeholder="输入风格分类" />
            </div>
            <div>
              <textarea v-model="draft.prompt" class="system-table__textarea" placeholder="输入风格描述"></textarea>
            </div>
            <div class="system-table__actions">
              <button type="button" class="is-primary" @click="saveEdit(item.id)">保存</button>
              <button type="button" @click="cancelEdit">取消</button>
              <button type="button" class="is-danger" @click="$emit('delete', item.id)">删除</button>
            </div>
          </template>

          <template v-else>
            <div>{{ index + 1 }}</div>
            <div>{{ item.name }}</div>
            <div>{{ item.category }}</div>
            <div class="system-table__multiline">{{ item.prompt }}</div>
            <div class="system-table__actions">
              <button type="button" @click="startEdit(item)">编辑</button>
              <button type="button" class="is-danger" @click="$emit('delete', item.id)">删除</button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { SystemStyleItem } from '@/types/system'

defineProps<{
  items: SystemStyleItem[]
  search: string
}>()

const emit = defineEmits<{
  (e: 'update:search', value: string): void
  (e: 'create', payload: { name: string; category: string; prompt: string }): void
  (e: 'update', id: string, payload: { name: string; category: string; prompt: string }): void
  (e: 'delete', id: string): void
}>()

const creating = ref(false)
const editingId = ref('')
const draft = reactive({
  name: '',
  category: '创作风格',
  prompt: '',
})

const onSearch = (event: Event): void => {
  const target = event.target as HTMLInputElement | null
  emit('update:search', target?.value ?? '')
}

const resetDraft = (): void => {
  draft.name = ''
  draft.category = '创作风格'
  draft.prompt = ''
}

const startCreate = (): void => {
  creating.value = true
  editingId.value = ''
  resetDraft()
}

const startEdit = (item: SystemStyleItem): void => {
  creating.value = false
  editingId.value = item.id
  draft.name = item.name
  draft.category = item.category
  draft.prompt = item.prompt
}

const cancelEdit = (): void => {
  creating.value = false
  editingId.value = ''
  resetDraft()
}

const normalizedPayload = () => ({
  name: draft.name.trim() || '未命名风格',
  category: draft.category.trim() || '创作风格',
  prompt: draft.prompt.trim() || '未填写风格描述',
})

const saveCreate = (): void => {
  emit('create', normalizedPayload())
  cancelEdit()
}

const saveEdit = (id: string): void => {
  emit('update', id, normalizedPayload())
  cancelEdit()
}
</script>
