<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchAnnouncements, publishAnnouncement } from '@/api/admin'
import type { AnnouncementRow } from '@/types/domain'

const list = ref<AnnouncementRow[]>([])
const modal = ref(false)

onMounted(async () => {
  const { list: rows } = await fetchAnnouncements()
  list.value = rows
})

function statusClass(t: AnnouncementRow['statusTone']) {
  return t === 'mint' ? 'mint' : 'amber'
}

async function onPublish() {
  await publishAnnouncement({})
  ElMessage.success('公告已发布 · 小程序将推送提醒策略')
  modal.value = false
}

function toastSwitch(label: string, on: boolean) {
  ElMessage.info(`${label} → ${on ? '开启' : '关闭'}`)
}
</script>

<template>
  <section class="panel active">
    <div class="toolbar">
      <button type="button" class="btn btn-primary" @click="modal = true">＋ 新建公告</button>
    </div>
    <div class="card" style="padding: 0; overflow: hidden">
      <table class="data">
        <thead>
          <tr>
            <th>标题</th>
            <th>推送范围</th>
            <th>弹窗</th>
            <th>定时</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in list" :key="i">
            <td>{{ r.title }}</td>
            <td>{{ r.scope }}</td>
            <td>{{ r.popup }}</td>
            <td>{{ r.schedule }}</td>
            <td><span class="tag" :class="statusClass(r.statusTone)">{{ r.status }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <div class="modal-center" :class="{ show: modal }" @click.self="modal = false">
        <div class="modal-box">
          <h3>新建公告</h3>
          <p class="hint">推送策略：全员 / 按角色 / 按区域 · 支持定时与小程序弹窗。</p>
          <div class="form-grid" style="margin-top: 14px">
            <div class="full">
              <label>标题<span style="color: var(--rose)">*</span></label>
              <input type="text" placeholder="例如：佣金结算周期调整说明" />
            </div>
            <div class="full">
              <label>正文（富文本 Markdown）<span style="color: var(--rose)">*</span></label>
              <textarea rows="5" placeholder="支持附件链接（仅内网域名）" />
            </div>
            <div class="full">
              <label>推送范围（多选）</label>
              <div class="chip-toggle" data-multi style="margin-top: 6px">
                <span class="on" data-v="all">全员</span>
                <span data-v="sales">业务员</span>
                <span data-v="mgr">部门经理</span>
                <span data-v="440112">黄埔区授权用户</span>
              </div>
            </div>
            <div>
              <label>定时发送</label>
              <input type="datetime-local" />
            </div>
            <div>
              <label>优先级</label>
              <select>
                <option>普通</option>
                <option selected>重要</option>
                <option>紧急</option>
              </select>
            </div>
            <div class="full switch-row" style="border: none; padding-top: 4px">
              <span>小程序启动弹窗（强提醒）</span>
              <el-switch :model-value="true" @change="(v) => toastSwitch('公告弹窗', Boolean(v))" />
            </div>
            <div class="full switch-row" style="border: none">
              <span>要求已读回执（抽查）</span>
              <el-switch :model-value="false" @change="(v) => toastSwitch('已读回执', Boolean(v))" />
            </div>
          </div>
          <div style="display: flex; gap: 10px; margin-top: 18px; justify-content: flex-end">
            <button type="button" class="btn" @click="modal = false">取消</button>
            <button type="button" class="btn btn-primary" @click="onPublish">发布</button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>
