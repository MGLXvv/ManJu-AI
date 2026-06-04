<template>
  <section class="system-permission-panel">
    <header class="system-panel-head">
      <div>
        <h2>权限管理</h2>
        <p>系统角色与模块权限矩阵</p>
      </div>
      <button v-if="!creating" type="button" class="system-page__primary" @click="startCreate">新增角色</button>
    </header>

    <div class="system-table-shell">
      <div class="system-table system-table--permissions">
        <div class="system-table__head">
          <div>序号</div>
          <div>角色名称</div>
          <div>资源库</div>
          <div>分镜</div>
          <div>配音</div>
          <div>消息通知</div>
          <div>成员数</div>
          <div>更新时间</div>
          <div>操作</div>
        </div>

        <div v-if="creating" class="system-table__row is-editing">
          <div>{{ items.length + 1 }}</div>
          <div><input v-model="draft.role" class="system-table__input" type="text" placeholder="输入角色名称" /></div>
          <div class="system-permission-matrix__cell"><label class="system-toggle"><input v-model="draft.permissions.resourceLibrary" type="checkbox" /><span></span></label></div>
          <div class="system-permission-matrix__cell"><label class="system-toggle"><input v-model="draft.permissions.storyboard" type="checkbox" /><span></span></label></div>
          <div class="system-permission-matrix__cell"><label class="system-toggle"><input v-model="draft.permissions.dubbing" type="checkbox" /><span></span></label></div>
          <div class="system-permission-matrix__cell"><label class="system-toggle"><input v-model="draft.permissions.systemMessage" type="checkbox" /><span></span></label></div>
          <div><input v-model.number="draft.members" class="system-table__input" type="number" min="0" placeholder="成员数" /></div>
          <div>新建后生成</div>
          <div class="system-table__actions">
            <button type="button" class="is-primary" @click="saveCreate">保存</button>
            <button type="button" @click="cancelEdit">取消</button>
          </div>
        </div>

        <div v-for="(item, index) in items" :key="item.id" class="system-table__row" :class="{ 'is-editing': editingId === item.id }">
          <template v-if="editingId === item.id">
            <div>{{ index + 1 }}</div>
            <div><input v-model="draft.role" class="system-table__input" type="text" placeholder="输入角色名称" /></div>
            <div class="system-permission-matrix__cell"><label class="system-toggle"><input v-model="draft.permissions.resourceLibrary" type="checkbox" /><span></span></label></div>
            <div class="system-permission-matrix__cell"><label class="system-toggle"><input v-model="draft.permissions.storyboard" type="checkbox" /><span></span></label></div>
            <div class="system-permission-matrix__cell"><label class="system-toggle"><input v-model="draft.permissions.dubbing" type="checkbox" /><span></span></label></div>
            <div class="system-permission-matrix__cell"><label class="system-toggle"><input v-model="draft.permissions.systemMessage" type="checkbox" /><span></span></label></div>
            <div><input v-model.number="draft.members" class="system-table__input" type="number" min="0" placeholder="成员数" /></div>
            <div>{{ item.updatedAt }}</div>
            <div class="system-table__actions">
              <button type="button" class="is-primary" @click="saveEdit(item.id)">保存</button>
              <button type="button" @click="cancelEdit">取消</button>
              <button type="button" class="is-danger" @click="$emit('delete', item.id)">删除</button>
            </div>
          </template>

          <template v-else>
            <div>{{ index + 1 }}</div>
            <div>{{ item.role }}</div>
            <div class="system-permission-matrix__cell"><span class="system-permission-pill" :class="{ 'is-enabled': item.permissions.resourceLibrary }">{{ item.permissions.resourceLibrary ? '开' : '关' }}</span></div>
            <div class="system-permission-matrix__cell"><span class="system-permission-pill" :class="{ 'is-enabled': item.permissions.storyboard }">{{ item.permissions.storyboard ? '开' : '关' }}</span></div>
            <div class="system-permission-matrix__cell"><span class="system-permission-pill" :class="{ 'is-enabled': item.permissions.dubbing }">{{ item.permissions.dubbing ? '开' : '关' }}</span></div>
            <div class="system-permission-matrix__cell"><span class="system-permission-pill" :class="{ 'is-enabled': item.permissions.systemMessage }">{{ item.permissions.systemMessage ? '开' : '关' }}</span></div>
            <div>{{ item.members }}</div>
            <div>{{ item.updatedAt }}</div>
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
import type { SystemPermissionItem } from '@/types/system'

const props = defineProps<{
  items: SystemPermissionItem[]
}>()

const emit = defineEmits<{
  (e: 'create', payload: { role: string; members: number; permissions: SystemPermissionItem['permissions'] }): void
  (e: 'update', id: string, payload: { role: string; members: number; permissions: SystemPermissionItem['permissions'] }): void
  (e: 'delete', id: string): void
}>()

const creating = ref(false)
const editingId = ref('')
const createDefaultPermissions = (): SystemPermissionItem['permissions'] => ({
  resourceLibrary: false,
  storyboard: false,
  dubbing: false,
  systemMessage: false,
})

const draft = reactive({
  role: '',
  members: 1,
  permissions: createDefaultPermissions(),
})

const resetDraft = (): void => {
  draft.role = ''
  draft.members = 1
  draft.permissions = createDefaultPermissions()
}

const startCreate = (): void => {
  creating.value = true
  editingId.value = ''
  resetDraft()
}

const startEdit = (item: SystemPermissionItem): void => {
  creating.value = false
  editingId.value = item.id
  draft.role = item.role
  draft.members = item.members
  draft.permissions = { ...item.permissions }
}

const cancelEdit = (): void => {
  creating.value = false
  editingId.value = ''
  resetDraft()
}

const normalizedPayload = () => ({
  role: draft.role.trim() || '未命名角色',
  members: Number.isFinite(draft.members) && draft.members >= 0 ? draft.members : 0,
  permissions: { ...draft.permissions },
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
