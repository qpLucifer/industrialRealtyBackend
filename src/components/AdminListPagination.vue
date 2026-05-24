<script setup lang="ts">
const page = defineModel<number>('page', { required: true })
const pageSize = defineModel<number>('pageSize', { required: true })

defineProps<{
  total: number
}>()

const emit = defineEmits<{
  change: []
}>()

function onPageChange() {
  emit('change')
}

function onSizeChange() {
  page.value = 1
  emit('change')
}
</script>

<template>
  <div class="admin-list-pagination">
    <el-pagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      background
      @current-change="onPageChange"
      @size-change="onSizeChange"
    />
  </div>
</template>

<style scoped>
.admin-list-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
