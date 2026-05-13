<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchSecuritySettings, putSecuritySettings } from '@/api/admin'
import type { SecuritySwitch } from '@/types/domain'

const switches = ref<SecuritySwitch[]>([])

onMounted(async () => {
  const { switches: sw } = await fetchSecuritySettings()
  switches.value = sw.map((s) => ({ ...s }))
})

async function onToggle(row: SecuritySwitch, val: boolean) {
  row.enabled = val
  await putSecuritySettings(switches.value)
  ElMessage.info(`${row.label} → ${val ? '开启' : '关闭'}`)
}

function onLowCodeInfo() {
  ElMessage.info('Low-code 表单设计器尚未接入；安全策略上方开关已直连 /api/settings/security。')
}
</script>

<template>
  <section class="panel active">
    <div class="card">
      <h3>安全策略</h3>
      <div v-for="s in switches" :key="s.key" class="switch-row">
        <span>{{ s.label }}</span>
        <el-switch :model-value="s.enabled" @change="(v) => onToggle(s, Boolean(v))" />
      </div>
    </div>
    <div class="card" style="margin-top: 14px">
      <h3>扩展配置（预留）</h3>
      <p class="hint">字段自定义、标签库、权限模板批量下发、Webhook 通知第三方 ERP。</p>
      <button type="button" class="btn btn-primary" style="margin-top: 12px" @click="onLowCodeInfo">
        打开 Low-code 表单设计器（预留）
      </button>
    </div>
  </section>
</template>
