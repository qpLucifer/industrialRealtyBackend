<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { postPropertyFollowUp } from '@/api/admin'
import { datetimeLocalToApi, nowBeijingDatetimeLocal } from '@/lib/beijingTime'
import {
  FOLLOW_UPLOAD_FOLDER,
  MAX_FOLLOW_IMAGES,
  MAX_FOLLOW_IMAGES_PER_PICK,
} from '@/lib/propertyFollowTimeline'
import { uploadAudioFile, uploadImagesBatch } from '@/lib/mediaUpload'
import { MAX_IMAGES_PER_PICK } from '@/lib/mediaUploadPolicy'
import { applyCosImageProcess } from '@/lib/mediaImageUrl'

const props = defineProps<{
  visible: boolean
  code: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  saved: []
}>()

const followNote = ref('')
const followOccurredAt = ref('')
const followImageUrls = ref<string[]>([])
const followAudioUrls = ref<string[]>([])
const uploadingFollowImages = ref(false)
const uploadingFollowAudio = ref(false)
const saving = ref(false)

function resetForm() {
  followNote.value = ''
  followOccurredAt.value = nowBeijingDatetimeLocal()
  followImageUrls.value = []
  followAudioUrls.value = []
}

function close() {
  emit('update:visible', false)
}

function imageSrc(url: string) {
  return applyCosImageProcess(url)
}

function removeFollowImage(idx: number) {
  followImageUrls.value = followImageUrls.value.filter((_, i) => i !== idx)
}

function removeFollowAudio(idx: number) {
  followAudioUrls.value = followAudioUrls.value.filter((_, i) => i !== idx)
}

async function onFollowImagesPick(ev: Event) {
  const input = ev.target as HTMLInputElement
  const files = input.files ? Array.from(input.files) : []
  if (!files.length) return
  const remain = MAX_FOLLOW_IMAGES - followImageUrls.value.length
  if (remain <= 0) {
    ElMessage.warning(`单条跟进最多 ${MAX_FOLLOW_IMAGES} 张图片`)
    input.value = ''
    return
  }
  const batch = Math.min(files.length, MAX_FOLLOW_IMAGES_PER_PICK, MAX_IMAGES_PER_PICK, remain)
  uploadingFollowImages.value = true
  try {
    const summary = await uploadImagesBatch(files.slice(0, batch), FOLLOW_UPLOAD_FOLDER)
    for (const item of summary.succeeded) {
      if (item.url) followImageUrls.value.push(item.url)
    }
    if (summary.failed.length) ElMessage.warning(`部分图片上传失败（${summary.failed.length}）`)
    else if (summary.succeeded.length) ElMessage.success('图片已上传')
  } catch {
    /* global http interceptor */
  } finally {
    uploadingFollowImages.value = false
    input.value = ''
  }
}

async function onFollowAudioPick(ev: Event) {
  const input = ev.target as HTMLInputElement
  const files = input.files ? Array.from(input.files) : []
  if (!files.length) return
  uploadingFollowAudio.value = true
  try {
    for (const file of files) {
      const { url } = await uploadAudioFile(file, FOLLOW_UPLOAD_FOLDER)
      followAudioUrls.value.push(url)
    }
    ElMessage.success('音频已上传')
  } catch {
    /* global http interceptor */
  } finally {
    uploadingFollowAudio.value = false
    input.value = ''
  }
}

async function onSaveFollow() {
  if (!props.code || saving.value) return
  const hasContent =
    followNote.value.trim() || followImageUrls.value.length || followAudioUrls.value.length
  if (!hasContent) {
    ElMessage.warning('请填写跟进内容或上传图片/音频')
    return
  }
  saving.value = true
  try {
    const payload: Record<string, unknown> = {
      code: props.code,
      note: followNote.value.trim(),
      occurredAt: datetimeLocalToApi(followOccurredAt.value),
    }
    if (followImageUrls.value.length) payload.imageUrls = [...followImageUrls.value]
    if (followAudioUrls.value.length) payload.audioUrls = [...followAudioUrls.value]
    await postPropertyFollowUp(payload)
    ElMessage.success('跟进已保存')
    emit('saved')
    close()
  } catch {
    /* global http interceptor */
  } finally {
    saving.value = false
  }
}

watch(
  () => props.visible,
  (open) => {
    if (open) resetForm()
  },
)
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="code ? `写跟进 · ${code}` : '写跟进'"
    width="640px"
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="form-grid">
      <div class="full">
        <label>跟进内容</label>
        <textarea v-model="followNote" rows="3" placeholder="现场情况、客户反馈、下一步（可与图片/音频组合）" />
      </div>
      <div class="full">
        <label>跟进图片（可选，单次最多 {{ MAX_FOLLOW_IMAGES_PER_PICK }} 张，可多次添加）</label>
        <div class="pf-follow-images">
          <div v-for="(url, idx) in followImageUrls" :key="url" class="pf-follow-thumb-wrap">
            <img :src="imageSrc(url)" alt="" class="pf-follow-thumb" referrerpolicy="no-referrer" />
            <button type="button" class="pf-follow-remove" @click="removeFollowImage(idx)">×</button>
          </div>
          <label
            v-if="followImageUrls.length < MAX_FOLLOW_IMAGES"
            class="pf-follow-add"
            :class="{ disabled: uploadingFollowImages }"
          >
            {{ uploadingFollowImages ? '上传中…' : '＋ 图片' }}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden @change="onFollowImagesPick" />
          </label>
        </div>
      </div>
      <div class="full">
        <label>跟进音频（可选，上传 mp3/m4a 等文件）</label>
        <div class="pf-follow-audio-edit">
          <label class="btn btn-sm" :class="{ disabled: uploadingFollowAudio }">
            {{ uploadingFollowAudio ? '上传中…' : '选择音频文件' }}
            <input type="file" accept="audio/*,.mp3,.m4a,.wav,.aac" multiple hidden @change="onFollowAudioPick" />
          </label>
          <div v-for="(url, idx) in followAudioUrls" :key="url" class="pf-follow-audio-row">
            <audio :src="url" controls preload="metadata" />
            <button type="button" class="btn btn-sm" @click="removeFollowAudio(idx)">删除</button>
          </div>
        </div>
      </div>
      <div class="full">
        <label>跟进时间<span style="color: var(--rose)">*</span></label>
        <input v-model="followOccurredAt" type="datetime-local" />
      </div>
    </div>
    <template #footer>
      <button type="button" class="btn" @click="close">取消</button>
      <button type="button" class="btn btn-primary" :disabled="saving" @click="onSaveFollow">
        {{ saving ? '保存中…' : '保存跟进' }}
      </button>
    </template>
  </el-dialog>
</template>

<style scoped>
.pf-follow-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}
.pf-follow-thumb-wrap {
  position: relative;
}
.pf-follow-thumb {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  display: block;
}
.pf-follow-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.65);
  color: #fff;
  cursor: pointer;
  line-height: 1;
  font-size: 14px;
}
.pf-follow-add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
}
.pf-follow-add.disabled {
  opacity: 0.6;
  pointer-events: none;
}
.pf-follow-audio-edit {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 6px;
}
.pf-follow-audio-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pf-follow-audio-row audio {
  flex: 1;
  min-width: 0;
  height: 32px;
}
</style>
