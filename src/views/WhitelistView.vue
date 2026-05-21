<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createWhitelistRow, deleteWhitelistRow, fetchWhitelist, updateWhitelistRow } from '@/api/admin'
import type { WhitelistRow } from '@/types/domain'
import { csvEscape, headerIndex, parseCsvWithHeader } from '@/lib/csv'
import TableActionBtn from '@/components/TableActionBtn.vue'
import { Delete, Edit } from '@element-plus/icons-vue'
import { normalizeCnMobileInput, onCnMobileCompositionEnd, preventNonDigitPhoneBeforeInput, preventNonDigitPhoneKeys, handleCnMobilePaste } from '@/lib/inputValidators'
import { beijingTodayYmd, formatBeijingDisplay } from '@/lib/beijingTime'

const list = ref<WhitelistRow[]>([])
const drawer = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({ phone: '', name: '', remark: '' })

async function load() {
  const { list: rows } = await fetchWhitelist()
  list.value = rows
}

function openNew() {
  editingId.value = null
  form.phone = ''
  form.name = ''
  form.remark = ''
  drawer.value = true
}

function openEdit(row: WhitelistRow) {
  editingId.value = row.id
  form.phone = normalizeCnMobileInput(row.phone)
  form.name = row.name
  form.remark = row.remark
  drawer.value = true
}

async function onSave() {
  const phone = normalizeCnMobileInput(form.phone)
  if (!/^\d{11}$/.test(phone)) {
    ElMessage.warning('请输入 11 位数字手机号')
    return
  }
  const today = beijingTodayYmd()
  const updatedBy = '后台管理员'
  if (editingId.value == null) {
    await createWhitelistRow({
      phone,
      name: form.name.trim().slice(0, 50),
      remark: form.remark.trim().slice(0, 200),
      updatedBy,
      updatedAt: today,
    })
    ElMessage.success('已新增')
  } else {
    await updateWhitelistRow(editingId.value, {
      phone,
      name: form.name.trim().slice(0, 50),
      remark: form.remark.trim().slice(0, 200),
      updatedBy,
      updatedAt: today,
    })
    ElMessage.success('已保存')
  }
  drawer.value = false
  await load()
}

async function onDelete(row: WhitelistRow) {
  try {
    await ElMessageBox.confirm(`删除白名单号码 ${row.phone}？`, '确认', { type: 'warning' })
  } catch {
    return
  }
  await deleteWhitelistRow(row.id)
  ElMessage.success('已删除')
  await load()
}

function onDownloadTemplate() {
  const headers = ['phone', 'name', 'remark']
  const row = ['13800138000', '示例用户', '备注可选，可含逗号需用引号']
  const csv = [headers.join(','), row.map((c) => csvEscape(c)).join(',')].join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'whitelist-template.csv'
  a.click()
  URL.revokeObjectURL(a.href)
  ElMessage.success('已下载模板')
}

function onImportClick() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.csv,text/csv'
  input.onchange = () => {
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const text = String(reader.result || '')
      const { headers, rows } = parseCsvWithHeader(text)
      if (!headers.length || !rows.length) {
        ElMessage.warning('CSV 至少需要表头 + 一行数据')
        return
      }
      const iPhone = headerIndex(headers, ['phone', '手机号'])
      const iName = headerIndex(headers, ['name', '姓名'])
      const iRemark = headerIndex(headers, ['remark', '备注'])
      const colPhone = iPhone >= 0 ? iPhone : 0
      const colName = iName >= 0 ? iName : 1
      const colRemark = iRemark >= 0 ? iRemark : 2
      const today = beijingTodayYmd()
      let n = 0
      let skipped = 0
      for (const cols of rows) {
        const phone = normalizeCnMobileInput(cols[colPhone] || '')
        if (!/^\d{11}$/.test(phone)) {
          skipped++
          continue
        }
        const name = String(cols[colName] ?? '').trim().slice(0, 50)
        const remark = String(cols[colRemark] ?? '').trim().slice(0, 200)
        await createWhitelistRow({
          phone,
          name,
          remark,
          updatedBy: 'CSV导入',
          updatedAt: today,
        })
        n++
      }
      const skipHint = skipped ? `，跳过 ${skipped} 行（手机号非 11 位）` : ''
      ElMessage.success(`已导入 ${n} 条${skipHint}`)
      await load()
    }
    reader.readAsText(file, 'UTF-8')
  }
  input.click()
}

onMounted(load)
</script>

<template>
  <section class="panel active">
    <div class="toolbar">
      <button type="button" class="btn btn-primary" @click="openNew">＋ 新增白名单</button>
      <button type="button" class="btn btn-primary" @click="onImportClick">导入 CSV</button>
      <button type="button" class="btn" @click="onDownloadTemplate">下载模板</button>
    </div>
    <div class="card">
      <h3>准入号码池（与小程序联动）</h3>
      <p class="hint" style="margin-top: 8px">
        小程序登录需同时满足：① 手机号在本白名单；②「员工与账号」中维护<strong>相同 11 位手机号</strong>，且员工为<strong>正常 / 账号状态正常</strong>；③ 员工设置<strong>负责区域</strong>后，小程序房源列表按区域过滤。
      </p>
      <table class="data" style="margin-top: 12px">
        <thead>
          <tr>
            <th>手机号</th>
            <th>姓名</th>
            <th>备注</th>
            <th>更新人</th>
            <th>时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in list" :key="r.id">
            <td>{{ r.phone }}</td>
            <td>{{ r.name }}</td>
            <td>{{ r.remark }}</td>
            <td>{{ r.updatedBy }}</td>
            <td>{{ formatBeijingDisplay(r.updatedAt) || r.updatedAt || '—' }}</td>
            <td>
              <div class="row-actions">
                <TableActionBtn title="编辑" :icon="Edit" @click="openEdit(r)" />
                <TableActionBtn title="删除" :icon="Delete" variant="danger" @click="onDelete(r)" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <el-drawer v-model="drawer" title="白名单" direction="rtl" size="min(420px, 100%)">
      <div class="form-grid">
        <div class="full">
          <label>手机号<span style="color: var(--rose)">*</span></label>
          <input
            :value="form.phone"
            type="tel"
            maxlength="11"
            inputmode="numeric"
            lang="en"
            pattern="[0-9]*"
            placeholder="11 位手机号"
            @beforeinput="preventNonDigitPhoneBeforeInput"
            @compositionend="onCnMobileCompositionEnd($event as CompositionEvent, (v) => (form.phone = v))"
            @keydown="preventNonDigitPhoneKeys"
            @paste="handleCnMobilePaste($event as ClipboardEvent, () => form.phone, (v) => (form.phone = v))"
            @input="form.phone = normalizeCnMobileInput(($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="full">
          <label>姓名</label>
          <input v-model="form.name" type="text" maxlength="50" />
        </div>
        <div class="full">
          <label>备注</label>
          <textarea v-model="form.remark" rows="3" maxlength="200" placeholder="最长 200 字" />
        </div>
      </div>
      <div style="display: flex; gap: 10px; margin-top: 18px">
        <button type="button" class="btn btn-primary" @click="onSave">保存</button>
        <button type="button" class="btn" @click="drawer = false">取消</button>
      </div>
    </el-drawer>
  </section>
</template>
