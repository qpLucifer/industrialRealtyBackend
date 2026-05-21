<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    title: string
    icon: Component
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
    disabled?: boolean
  }>(),
  { variant: 'primary', disabled: false },
)

const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <el-tooltip :content="title" placement="top">
    <button
      type="button"
      class="tbl-act"
      :class="`tbl-act--${variant}`"
      :disabled="disabled"
      :aria-label="title"
      @click="emit('click')"
    >
      <el-icon :size="16"><component :is="icon" /></el-icon>
    </button>
  </el-tooltip>
</template>
