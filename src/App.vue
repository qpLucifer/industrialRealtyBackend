<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import { installGlobalButtonDebounce } from '@/lib/globalButtonDebounce'

let uninstallButtonDebounce: (() => void) | undefined

onMounted(() => {
  uninstallButtonDebounce = installGlobalButtonDebounce()
})

onUnmounted(() => {
  uninstallButtonDebounce?.()
})
</script>

<template>
  <RouterView />
</template>
