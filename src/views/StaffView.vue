<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchStaffForm, fetchStaffList, saveStaffForm } from '@/api/admin'
import type { StaffForm, StaffRow } from '@/types/domain'
import { regionChipOptions } from '@/constants/regionChips'

const list = ref<StaffRow[]>([])
const drawer = ref(false)
const form = reactive<StaffForm>({} as StaffForm)

function tagClass(role: string) {
  if (role === '业务员') return 'cyan'
  if (role === '部门经理') return 'amber'
  return 'mint'
}

async function openDrawer() {
  const f = await fetchStaffForm()
  Object.assign(form, f)
  drawer.value = true
}

async function openEdit() {
  await openDrawer()
}

onMounted(async () => {
  const { list: rows } = await fetchStaffList()
  list.value = rows
})

function toggleRegion(id: string) {
  const set = new Set(form.regionIds)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  form.regionIds = Array.from(set)
}

async function onSave() {
  await saveStaffForm({ ...form })
  ElMessage.success('员工权限已保存（原型）')
  drawer.value = false
}
</script>

<template>
  <section class="panel active">
    <div class="toolbar">
      <button type="button" class="btn btn-primary" @click="openDrawer">＋ 新建员工</button>
      <button type="button" class="btn">批量导入 Excel</button>
      <button type="button" class="btn">权限模板</button>
      <input type="search" placeholder="搜索：姓名 / 手机 / 工号" style="min-width: 220px" />
      <select>
        <option>全部角色</option>
        <option>超级管理员</option>
        <option>部门经理</option>
        <option>业务员</option>
      </select>
    </div>
    <div class="card" style="padding: 0; overflow: hidden">
      <table class="data">
        <thead>
          <tr>
            <th>工号</th>
            <th>姓名</th>
            <th>手机</th>
            <th>角色</th>
            <th>负责区域（≤2）</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in list" :key="s.id">
            <td>{{ s.employeeNo }}</td>
            <td>{{ s.name }}</td>
            <td>{{ s.phoneMasked }}</td>
            <td><span class="tag" :class="tagClass(s.role)">{{ s.role }}</span></td>
            <td>{{ s.regions }}</td>
            <td><span class="tag mint">{{ s.status }}</span></td>
            <td>
              <div class="row-actions">
                <button type="button" class="btn btn-primary" @click="openEdit">编辑</button>
                <button type="button" class="btn">禁用</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="hint" style="margin-top: 12px">一人一号 · 离职「禁用」即时回收小程序会话 · OpenID 绑定解耦。</p>

    <el-drawer v-model="drawer" direction="rtl" size="min(520px, 100%)" :show-close="true" title="">
      <template #header>
        <h3 style="margin: 0; font-size: 17px">员工档案 / 权限矩阵</h3>
      </template>
      <p class="hint">与小程序账号一对一映射 · 区域节点最多 2 个叶子 · 角色决定审核 / 导出能力。</p>
      <div class="form-grid">
        <div>
          <label>工号<span style="color: var(--rose)">*</span></label>
          <input v-model="form.employeeNo" type="text" />
        </div>
        <div>
          <label>姓名<span style="color: var(--rose)">*</span></label>
          <input v-model="form.name" type="text" />
        </div>
        <div>
          <label>手机号<span style="color: var(--rose)">*</span></label>
          <input v-model="form.phone" type="text" />
        </div>
        <div>
          <label>邮箱</label>
          <input v-model="form.email" type="text" />
        </div>
        <div>
          <label>部门<span style="color: var(--rose)">*</span></label>
          <input v-model="form.department" type="text" />
        </div>
        <div>
          <label>职位</label>
          <input v-model="form.title" type="text" />
        </div>
        <div>
          <label>入职日期</label>
          <input v-model="form.hireDate" type="text" />
        </div>
        <div>
          <label>账号状态</label>
          <select v-model="form.accountStatus">
            <option>正常</option>
            <option>禁用（离职）</option>
            <option>冻结（风控）</option>
          </select>
        </div>
        <div class="full">
          <label>角色<span style="color: var(--rose)">*</span></label>
          <select v-model="form.role">
            <option>业务员</option>
            <option>部门经理</option>
            <option>超级管理员</option>
          </select>
        </div>
        <div class="full">
          <label>负责区域（最多选 2 个叶子节点）</label>
          <div class="chip-toggle" data-multi style="margin-top: 6px">
            <span
              v-for="opt in regionChipOptions"
              :key="opt.id"
              :class="{ on: form.regionIds?.includes(opt.id) }"
              :data-v="opt.id"
              @click="toggleRegion(opt.id)"
              >{{ opt.label }}</span
            >
          </div>
          <p class="hint" style="margin-top: 8px">数据库保存 region_ids JSON · 服务端强制校验数量 ≤2。</p>
        </div>
        <div class="full">
          <label>数据可见范围（自动生成）</label>
          <input v-model="form.dataScopeHint" type="text" readonly />
        </div>
        <div>
          <label>企业微信 UserId</label>
          <input v-model="form.wecomUserId" type="text" />
        </div>
        <div>
          <label>小程序 OpenID</label>
          <input v-model="form.openIdHint" type="text" readonly />
        </div>
        <div class="full">
          <label>备注（人事 / 合规）</label>
          <textarea v-model="form.remark" />
        </div>
      </div>
      <div style="display: flex; gap: 10px; margin-top: 22px">
        <button type="button" class="btn btn-primary" @click="onSave">保存</button>
        <button type="button" class="btn" @click="drawer = false">取消</button>
      </div>
    </el-drawer>
  </section>
</template>
