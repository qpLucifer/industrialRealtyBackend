<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  deleteCustomerBySlug,
  fetchCustomerDetail,
  fetchCustomers,
  fetchStaffList,
  postCustomer,
  postCustomerFollowUp,
  putCustomerApi,
} from '@/api/admin'
import type { CustomerDetail, CustomerGrade, CustomerRow, StaffRow } from '@/types/domain'
import { Delete, Edit, View } from '@element-plus/icons-vue'

const list = ref<CustomerRow[]>([])
const scopeFilter = ref<'all' | 'private' | 'public'>('all')
const gradeFilter = ref<string>('all')
const dealFilter = ref<string>('all')
const searchQ = ref('')

const drawer = ref(false)
const drawerMode = ref<'detail' | 'edit' | 'new'>('detail')
const activeSlug = ref('')
const detail = ref<CustomerDetail | null>(null)

const staffOptions = ref<StaffRow[]>([])

const editForm = reactive({
  company: '',
  contactName: '',
  titleLine: '',
  phone: '',
  grade: 'B 类' as CustomerGrade,
  dealStatus: '洽谈中',
  demandSummary: '',
  addressHint: '',
  /** Staff ids for multi-select — serialized as owner names on save */
  ownerStaffIds: [] as string[],
  scope: '私有' as '私有' | '公有',
})

const followNote = ref('')
const followOccurredAt = ref('')
const followGrade = ref<'' | CustomerGrade>('')
const followNextAt = ref('')

async function load() {
  const { list: rows } = await fetchCustomers({
    scope: scopeFilter.value,
    grade: gradeFilter.value,
    deal: dealFilter.value,
    q: searchQ.value,
  })
  list.value = rows
}

async function loadStaff() {
  const { list } = await fetchStaffList({})
  staffOptions.value = list
}

function validatePhoneClient(phone: string): string | null {
  const s = String(phone || '').replace(/\s/g, '')
  if (s.length < 7 || s.length > 20) return '手机号长度应为 7–20 位'
  if (!/^\+?\d{7,20}$/.test(s)) return '手机号仅允许数字（可带开头 +）'
  return null
}

function ownerNamesFromStaffIds(ids: string[]) {
  return ids
    .map((id) => staffOptions.value.find((x) => x.id === id)?.name)
    .filter(Boolean)
    .join('、')
}

function staffIdsFromOwnerName(ownerName: string) {
  if (!ownerName.trim()) return []
  const parts = ownerName.split(/[,，、]/).map((s) => s.trim()).filter(Boolean)
  const ids: string[] = []
  for (const p of parts) {
    const row = staffOptions.value.find((x) => x.name === p)
    if (row) ids.push(row.id)
  }
  return ids
}

onMounted(() => {
  void loadStaff().then(() => load())
})

const pendingFollowCount = computed(() => list.value.filter((r) => r.nextReminder !== '—').length)

function gradeClass(g: string) {
  if (g.startsWith('A')) return 'mint'
  if (g.startsWith('B')) return 'cyan'
  return 'rose'
}

function drawerTitle() {
  if (drawerMode.value === 'new') return '新增客户'
  if (drawerMode.value === 'edit') return '编辑客户'
  return detail.value ? `客户详情 · ${detail.value.name}` : '客户详情'
}

function resetFollowFields() {
  followNote.value = ''
  followOccurredAt.value = new Date().toISOString().slice(0, 16)
  followGrade.value = ''
  followNextAt.value = ''
}

async function openDetail(row: CustomerRow) {
  const slug = row.slug || row.id
  if (!slug) {
    ElMessage.warning('缺少客户标识')
    return
  }
  activeSlug.value = slug
  drawerMode.value = 'detail'
  detail.value = await fetchCustomerDetail(slug)
  resetFollowFields()
  drawer.value = true
}

function openNew() {
  activeSlug.value = ''
  drawerMode.value = 'new'
  detail.value = null
  void loadStaff()
  editForm.company = ''
  editForm.contactName = ''
  editForm.titleLine = ''
  editForm.phone = ''
  editForm.grade = 'B 类'
  editForm.dealStatus = '洽谈中'
  editForm.demandSummary = ''
  editForm.addressHint = ''
  editForm.ownerStaffIds = []
  editForm.scope = '私有'
  drawer.value = true
}

async function openEdit(row: CustomerRow) {
  const slug = row.slug || row.id
  if (!slug) return
  if (!staffOptions.value.length) await loadStaff()
  const d = await fetchCustomerDetail(slug)
  activeSlug.value = slug
  drawerMode.value = 'edit'
  detail.value = d
  editForm.company = d.company || ''
  editForm.contactName = d.contactName
  editForm.titleLine =
    (d.titleLine || '').trim() || [d.contactName, d.company].filter(Boolean).join(' · ') || d.company || ''
  editForm.phone = d.phone
  editForm.grade = d.grade
  editForm.dealStatus = d.dealStatus || '洽谈中'
  editForm.demandSummary = d.demandSummary
  editForm.addressHint = d.addressHint
  editForm.ownerStaffIds = staffIdsFromOwnerName(d.ownerName || '')
  editForm.scope = d.badgesHtml?.includes('公有') ? '公有' : '私有'
  drawer.value = true
}

async function onSaveCustomer() {
  if (!editForm.company.trim() || !editForm.contactName.trim() || !String(editForm.phone).trim()) {
    ElMessage.warning('公司、联系人、手机为必填')
    return
  }
  const phoneErr = validatePhoneClient(editForm.phone)
  if (phoneErr) {
    ElMessage.warning(phoneErr)
    return
  }
  const ownerName = ownerNamesFromStaffIds(editForm.ownerStaffIds)
  const payload = {
    company: editForm.company.trim(),
    contactName: editForm.contactName.trim(),
    titleLine: editForm.titleLine.trim(),
    phone: editForm.phone.replace(/\s/g, ''),
    grade: editForm.grade,
    dealStatus: editForm.dealStatus,
    demandSummary: editForm.demandSummary.trim(),
    addressHint: editForm.addressHint.trim(),
    ownerName,
    scope: editForm.scope,
  }
  if (drawerMode.value === 'new') {
    await postCustomer(payload)
    ElMessage.success('已新增客户')
  } else {
    await putCustomerApi(activeSlug.value, payload)
    ElMessage.success('已保存')
  }
  drawer.value = false
  await load()
}

async function onDelete(row: CustomerRow) {
  const slug = row.slug || row.id
  if (!slug) return
  try {
    await ElMessageBox.confirm(`确定删除客户「${row.name}」？此操作不可恢复。`, '确认删除', { type: 'warning' })
  } catch {
    return
  }
  await deleteCustomerBySlug(slug)
  ElMessage.success('已删除')
  if (activeSlug.value === slug) drawer.value = false
  await load()
}

async function onSaveFollow() {
  if (!detail.value) return
  const slug = activeSlug.value
  if (!followNote.value.trim()) {
    ElMessage.warning('请填写跟进内容')
    return
  }
  const payload: Record<string, string> = {
    slug,
    note: followNote.value.trim(),
    occurredAt: followOccurredAt.value.replace('T', ' '),
  }
  if (followGrade.value) payload.grade = followGrade.value
  if (followNextAt.value) {
    payload.nextReminderAt = followNextAt.value.replace('T', ' ')
    payload.nextReminder = followNextAt.value.replace('T', ' ')
  }
  await postCustomerFollowUp(payload)
  ElMessage.success('跟进已保存')
  detail.value = await fetchCustomerDetail(slug)
  resetFollowFields()
  await load()
}

function onRemind() {
  ElMessage.success(`今日待跟进相关客户约 ${pendingFollowCount.value} 条（下次提醒非「—」）`)
}
</script>

<template>
  <section class="panel active">
    <div class="toolbar">
      <select v-model="scopeFilter" @change="load">
        <option value="all">全部范围</option>
        <option value="private">仅私海</option>
        <option value="public">仅公海</option>
      </select>
      <select v-model="gradeFilter" @change="load">
        <option value="all">全部等级</option>
        <option value="A 类">A 类</option>
        <option value="B 类">B 类</option>
        <option value="C 类">C 类</option>
      </select>
      <select v-model="dealFilter" @change="load">
        <option value="all">全部成交状态</option>
        <option value="洽谈中">洽谈中</option>
        <option value="已成交">已成交</option>
        <option value="搁置">搁置</option>
      </select>
      <input v-model="searchQ" type="search" placeholder="电话尾号 / 公司 / 需求关键词…" style="min-width: 240px" @keyup.enter="load" />
      <button type="button" class="btn btn-primary" @click="() => loadStaff().then(() => load())">查询</button>
      <button type="button" class="btn btn-primary" @click="openNew">＋ 新增客户</button>
      <button type="button" class="btn" @click="onRemind">今日待跟进</button>
    </div>
    <div class="card crm-list-card" style="padding: 0; overflow-x: auto">
      <table class="data data-crm">
        <thead>
          <tr>
            <th style="min-width: 110px">联系电话</th>
            <th style="min-width: 200px">公司 / 主体</th>
            <th style="min-width: 180px">主题（列表标题行）</th>
            <th style="min-width: 160px">客户名称</th>
            <th style="min-width: 160px">地址 / 区域</th>
            <th style="min-width: 200px">需求摘要</th>
            <th style="min-width: 100px">等级</th>
            <th style="min-width: 100px">成交状态</th>
            <th style="min-width: 130px">最近跟进</th>
            <th style="min-width: 130px">下次提醒</th>
            <th style="min-width: 90px">负责人</th>
            <th style="min-width: 200px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in list" :key="r.slug || r.id">
            <td>{{ r.phoneMasked }}</td>
            <td>
              <span class="crm-cell-strong">{{ r.company || '—' }}</span>
            </td>
            <td class="cell-wrap hint-sm">{{ r.titleLine || '—' }}</td>
            <td>
              <span class="crm-cell-strong">{{ r.contactName || r.name }}</span>
            </td>
            <td class="cell-wrap hint-sm">{{ r.addressHint || '—' }}</td>
            <td class="cell-wrap">{{ r.demandSummary }}</td>
            <td><span class="tag" :class="gradeClass(r.grade)">{{ r.grade }}</span></td>
            <td>{{ r.dealStatus || '—' }}</td>
            <td>{{ r.lastFollowAt }}</td>
            <td>
              <template v-if="r.nextReminder === '—'">—</template>
              <span v-else class="tag" :class="r.hasNextReminderTag === 'amber' ? 'amber' : 'mint'">{{ r.nextReminder }}</span>
            </td>
            <td>{{ r.ownerName }}</td>
            <td class="table-actions">
              <el-tooltip content="详情" placement="top">
                <el-button type="primary" :icon="View" circle plain size="small" @click="openDetail(r)" />
              </el-tooltip>
              <el-tooltip content="编辑" placement="top">
                <el-button type="primary" :icon="Edit" circle plain size="small" @click="openEdit(r)" />
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button type="danger" :icon="Delete" circle plain size="small" @click="onDelete(r)" />
              </el-tooltip>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <el-drawer v-model="drawer" :title="drawerTitle()" size="min(560px, 92vw)" destroy-on-close class="crm-drawer">
      <template v-if="drawerMode === 'detail' && detail">
        <div class="crm-hero">
          <div class="crm-hero-title">{{ detail.company || '—' }}</div>
          <div class="crm-hero-sub">{{ detail.titleLine || [detail.contactName, detail.company].filter(Boolean).join(' · ') }}</div>
          <div class="crm-hero-meta">
            <span>{{ detail.contactName }}</span>
            <span class="crm-dot">·</span>
            <span>手机 {{ detail.phone || '—' }}</span>
            <span class="crm-dot">·</span>
            <span>负责人 {{ detail.ownerName || '—' }}</span>
            <span class="crm-dot">·</span>
            <span>成交 {{ detail.dealStatus }}</span>
          </div>
        </div>

        <div class="crm-card">
          <div class="crm-card-title">需求与地址</div>
          <p class="crm-card-body">{{ detail.demandSummary || '—' }}</p>
          <p class="crm-card-muted">{{ detail.addressHint || '—' }}</p>
        </div>

        <div class="crm-card">
          <div class="crm-card-title">跟进时间轴</div>
          <div v-if="detail.timelineHtml" class="crm-timeline cell-wrap" v-html="detail.timelineHtml" />
          <p v-else class="crm-card-muted">（暂无记录）</p>
        </div>

        <div class="crm-card crm-card-accent">
          <div class="crm-card-title">写跟进</div>
          <div class="form-grid">
            <div class="full">
              <label>跟进内容<span style="color: var(--rose)">*</span></label>
              <textarea v-model="followNote" rows="3" placeholder="事实描述、客户原话摘要、下一步" />
            </div>
            <div>
              <label>跟进时间<span style="color: var(--rose)">*</span></label>
              <input v-model="followOccurredAt" type="datetime-local" />
            </div>
            <div>
              <label>客户等级调整</label>
              <select v-model="followGrade">
                <option value="">不调整</option>
                <option value="A 类">A 类</option>
                <option value="B 类">B 类</option>
                <option value="C 类">C 类</option>
              </select>
            </div>
            <div class="full">
              <label>下次沟通提醒（可选）</label>
              <input v-model="followNextAt" type="datetime-local" />
            </div>
          </div>
          <button type="button" class="btn btn-primary crm-follow-btn" @click="onSaveFollow">保存跟进</button>
        </div>
      </template>

      <template v-else>
        <div class="form-grid">
          <div class="full">
            <label>公司 / 主体<span style="color: var(--rose)">*</span></label>
            <input v-model="editForm.company" type="text" maxlength="255" />
          </div>
          <div class="full">
            <label>主题（列表摘要行）</label>
            <input v-model="editForm.titleLine" type="text" maxlength="255" placeholder="例：张晨 · 某某公司" />
          </div>
          <div>
            <label>联系人<span style="color: var(--rose)">*</span></label>
            <input v-model="editForm.contactName" type="text" maxlength="64" />
          </div>
          <div>
            <label>手机<span style="color: var(--rose)">*</span></label>
            <input v-model="editForm.phone" type="text" maxlength="32" />
          </div>
          <div>
            <label>等级</label>
            <select v-model="editForm.grade">
              <option value="A 类">A 类</option>
              <option value="B 类">B 类</option>
              <option value="C 类">C 类</option>
            </select>
          </div>
          <div>
            <label>成交状态</label>
            <select v-model="editForm.dealStatus">
              <option value="洽谈中">洽谈中</option>
              <option value="已成交">已成交</option>
              <option value="搁置">搁置</option>
            </select>
          </div>
          <div>
            <label>客户池</label>
            <select v-model="editForm.scope" title="私海：仅负责人可见；公海：团队共享">
              <option value="私有">私海</option>
              <option value="公有">公海</option>
            </select>
          </div>
          <div class="full">
            <label>地址 / 区域提示</label>
            <input v-model="editForm.addressHint" type="text" maxlength="255" />
          </div>
          <div class="full">
            <label>需求摘要</label>
            <textarea v-model="editForm.demandSummary" rows="3" maxlength="2000" />
          </div>
          <div class="full">
            <label>负责人（员工，可多选）</label>
            <el-select
              v-model="editForm.ownerStaffIds"
              multiple
              filterable
              collapse-tags
              collapse-tags-tooltip
              placeholder="从员工列表选择"
              style="width: 100%; margin-top: 4px"
            >
              <el-option
                v-for="s in staffOptions"
                :key="s.id"
                :label="`${s.name}（${s.employeeNo}）`"
                :value="s.id"
              />
            </el-select>
          </div>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 20px">
          <button type="button" class="btn btn-primary" @click="onSaveCustomer">{{ drawerMode === 'new' ? '创建' : '保存' }}</button>
          <button type="button" class="btn" @click="drawer = false">取消</button>
        </div>
      </template>
    </el-drawer>
  </section>
</template>

<style scoped>
.crm-list-card {
  border-radius: 10px;
}
.table-actions {
  white-space: nowrap;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.hint-sm {
  font-size: 12px;
  color: #64748b;
  line-height: 1.45;
}
.crm-cell-strong {
  font-weight: 600;
  color: #0f172a;
}
.crm-hero {
  padding: 16px 18px;
  margin: -8px -4px 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 55%, #f8fafc 100%);
  border: 1px solid rgba(14, 165, 233, 0.2);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}
.crm-hero-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.35;
  letter-spacing: -0.02em;
}
.crm-hero-sub {
  margin-top: 6px;
  font-size: 13px;
  color: #475569;
  line-height: 1.45;
}
.crm-hero-meta {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 4px;
  font-size: 12px;
  color: #64748b;
}
.crm-dot {
  opacity: 0.45;
  padding: 0 2px;
}
.crm-card {
  padding: 14px 16px;
  margin-bottom: 14px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.crm-card-accent {
  background: linear-gradient(180deg, #fafbfc 0%, #ffffff 100%);
  border-color: rgba(59, 130, 246, 0.18);
}
.crm-card-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  margin-bottom: 10px;
}
.crm-card-body {
  margin: 0;
  font-size: 14px;
  color: #1e293b;
  line-height: 1.55;
}
.crm-card-muted {
  margin: 10px 0 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
}
.crm-timeline {
  font-size: 13px;
  line-height: 1.65;
  color: #334155;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px dashed rgba(100, 116, 139, 0.35);
}
.crm-follow-btn {
  margin-top: 14px;
}
:deep(.crm-drawer .el-drawer__body) {
  padding-top: 8px;
}
</style>
