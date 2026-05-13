<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchCustomers, postCustomerFollowUp } from '@/api/admin'
import type { CustomerRow } from '@/types/domain'

const list = ref<CustomerRow[]>([])
const q = ref('')
const followOpen = ref(false)
const dimRemind = ref(false)

onMounted(async () => {
  const { list: rows } = await fetchCustomers()
  list.value = rows
})

const filtered = computed(() => {
  const s = q.value.trim().toLowerCase()
  if (!s) return list.value
  return list.value.filter((r) => {
    const blob = `${r.phoneMasked} ${r.name} ${r.addressHint} ${r.demandSummary} ${r.timelineHtml}`.toLowerCase()
    return blob.includes(s)
  })
})

function gradeClass(g: string) {
  if (g.startsWith('A')) return 'mint'
  if (g.startsWith('B')) return 'cyan'
  return 'rose'
}

function onRemind() {
  ElMessage.success('今日待跟进：3 条（含 1 条 A 类超时）· 已推送小程序待办')
  dimRemind.value = true
  window.setTimeout(() => {
    dimRemind.value = false
  }, 2400)
}

async function onSaveFollow() {
  await postCustomerFollowUp({})
  ElMessage.success('跟进已写入 · 时间轴与提醒已更新（原型）')
  followOpen.value = false
}

function rowDimClass(row: CustomerRow) {
  if (!dimRemind.value) return false
  return !row.hasNextReminderTag
}
</script>

<template>
  <section class="panel active">
    <div class="toolbar">
      <select>
        <option>全部范围</option>
        <option>仅私有</option>
        <option>仅公有</option>
      </select>
      <select>
        <option>客户等级</option>
        <option>A 类重点</option>
        <option>B 类培育</option>
        <option>C 类观察</option>
      </select>
      <select>
        <option>成交状态</option>
        <option>洽谈中</option>
        <option>已成交</option>
        <option>搁置</option>
      </select>
      <input v-model="q" type="search" placeholder="电话尾号 / 公司 / 需求关键词…" style="min-width: 240px" />
      <button type="button" class="btn btn-primary" @click="onRemind">今日待跟进</button>
    </div>
    <div
      class="card"
      style="
        padding: 12px 16px;
        margin-bottom: 12px;
        background: linear-gradient(135deg, rgba(254, 243, 199, 0.9), #ffffff);
        border-color: rgba(251, 191, 36, 0.35);
      "
    >
      <strong style="font-size: 13px">客户跟进台账（与业务 Excel 同源字段）</strong>
      <p class="hint" style="margin-top: 6px">
        四列结构：联系电话 · 客户名称与地址 · 需求摘要 · 跟进时间轴；支持 ABC 分级与「下次沟通」系统提醒。
      </p>
    </div>
    <div class="card" style="padding: 0; overflow-x: auto">
      <table class="data data-crm">
        <thead>
          <tr>
            <th style="min-width: 110px">联系电话</th>
            <th style="min-width: 200px">客户名称 / 地址</th>
            <th style="min-width: 260px">需求摘要</th>
            <th style="min-width: 120px">等级</th>
            <th style="min-width: 130px">最近跟进时间</th>
            <th style="min-width: 130px">下次提醒</th>
            <th style="min-width: 320px">跟进时间轴</th>
            <th style="min-width: 90px">负责人</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filtered" :key="r.id" :class="{ 'row-dim': rowDimClass(r) }">
            <td>{{ r.phoneMasked }}</td>
            <td>
              <strong>{{ r.name }}</strong><br />
              <span class="hint">{{ r.addressHint }}</span>
            </td>
            <td class="cell-wrap">{{ r.demandSummary }}</td>
            <td><span class="tag" :class="gradeClass(r.grade)">{{ r.grade }}</span></td>
            <td>{{ r.lastFollowAt }}</td>
            <td>
              <template v-if="r.nextReminder === '—'">—</template>
              <span v-else class="tag" :class="r.hasNextReminderTag === 'amber' ? 'amber' : 'mint'">{{ r.nextReminder }}</span>
            </td>
            <td class="cell-wrap cell-timeline" v-html="r.timelineHtml" />
            <td>{{ r.ownerName }}</td>
            <td><button type="button" class="btn btn-primary" style="padding: 6px 10px" @click="followOpen = true">写跟进</button></td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="hint" style="margin-top: 12px">
      登记建档沿用「全量登记表」展开录入（与小程序新建客户同源）；系统按「下次提醒」推送小程序 / 企微待办。业务员侧号码默认脱敏。
    </p>

    <Teleport to="body">
      <div class="modal-center" :class="{ show: followOpen }" @click.self="followOpen = false">
        <div class="modal-box" style="max-width: 560px">
          <h3>追加跟进记录</h3>
          <p class="hint">写入后更新「最近跟进时间」；可同步设置系统提醒（下次沟通）。</p>
          <div class="form-grid" style="margin-top: 14px">
            <div class="full">
              <label>跟进内容<span style="color: var(--rose)">*</span></label>
              <textarea rows="4" placeholder="事实描述、客户原话摘要、下一步" />
            </div>
            <div>
              <label>跟进发生时间<span style="color: var(--rose)">*</span></label>
              <input type="datetime-local" />
            </div>
            <div>
              <label>客户等级调整</label>
              <select>
                <option>保持 A 类</option>
                <option>降为 B 类</option>
                <option>降为 C 类</option>
                <option>升为 A 类</option>
              </select>
            </div>
            <div class="full">
              <label>下次沟通提醒（系统推送）</label>
              <input type="datetime-local" />
            </div>
          </div>
          <div style="display: flex; gap: 10px; margin-top: 18px; justify-content: flex-end">
            <button type="button" class="btn" @click="followOpen = false">取消</button>
            <button type="button" class="btn btn-primary" @click="onSaveFollow">保存</button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>
