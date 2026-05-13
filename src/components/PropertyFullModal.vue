<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchPropertyDetail, savePropertySnapshot } from '@/api/admin'
import type { PropertyFullForm } from '@/types/domain'

const props = defineProps<{
  visible: boolean
  code: string
  mode: 'edit' | 'view'
}>()

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
}>()

const form = reactive<PropertyFullForm>({} as PropertyFullForm)
const tab = ref(0)

const typeOptions = ['标准厂房', '独门独院厂房', '仓库', '工业用地', '写字楼', '产业园商铺'] as const
const photoOptions = ['门口形象照', '路口进出照', '车间照片', '货梯', '厂房屋顶', '视频'] as const
const structureOptions = ['钢构', '框架', '其他'] as const
const rightsOptions = ['国有土地', '出让', '划拨', '集体土地', '其他'] as const
const landUseOptions = ['工业', '仓储', '其他'] as const
const certOptions = ['房产证', '土地证', '消防验收证', '环保批文'] as const
const fireOptions = ['喷淋', '烟感', '消防栓', '其他'] as const

function toggle(arr: string[], v: string) {
  const i = arr.indexOf(v)
  if (i >= 0) arr.splice(i, 1)
  else arr.push(v)
}

watch(
  () => [props.visible, props.code] as const,
  async ([vis, code]) => {
    if (!vis) return
    const d = await fetchPropertyDetail(code)
    Object.assign(form, d)
  },
)

function close() {
  emit('update:visible', false)
}

async function onSave() {
  await savePropertySnapshot({ ...form, mode: props.mode, code: props.code })
  ElMessage.success(props.mode === 'edit' ? '房源已保存 · 新版本已生效（原型）' : '房源后台快照已保存')
  close()
}

function setTab(i: number) {
  tab.value = i
}
</script>

<template>
  <Teleport to="body">
    <div class="modal-center" :class="{ show: visible }" @click.self="close">
      <div class="modal-box modal-prop-box">
        <div class="modal-prop-head">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 14px">
            <div>
              <h3 style="margin: 0">
                {{ mode === 'edit' ? '编辑房源 · #' + code : '房源全字段 · #' + code }}
              </h3>
              <p class="hint" style="margin-top: 6px">
                {{
                  mode === 'edit'
                    ? '在此修改任意 Tab 字段后保存；将生成新版本并写入审计（原型）· 与小程序对外展示字段联动。'
                    : '与小程序「发布房源」同源模型 · 分 Tab 查看 · 含 GPS 坐标（小程序详情页底部地图）· 支持快照。'
                }}
              </p>
            </div>
            <button type="button" class="modal-close-icon" aria-label="关闭" @click="close">×</button>
          </div>
          <div class="admin-modal-tabs">
            <button type="button" :class="{ active: tab === 0 }" @click="setTab(0)">Step 1 · 分类 · 基础 · 媒体</button>
            <button type="button" :class="{ active: tab === 1 }" @click="setTab(1)">Step 2 · 土地 · 配套 · 使用（2–5）</button>
            <button type="button" :class="{ active: tab === 2 }" @click="setTab(2)">Step 3 · 产权 · 合规 · 跟进（7–13）</button>
          </div>
        </div>
        <div class="modal-prop-scroll">
          <div class="prop-admin-panel" :class="{ active: tab === 0 }">
            <div class="form-grid" style="margin-top: 0">
              <div class="full">
                <label>房源类型（多选）<span style="color: var(--rose)">*</span></label>
                <div class="chip-toggle" data-multi style="margin-top: 6px">
                  <span
                    v-for="t in typeOptions"
                    :key="t"
                    :class="{ on: form.types?.includes(t) }"
                    @click="toggle(form.types, t)"
                    >{{ t }}</span
                  >
                </div>
              </div>
              <div class="full">
                <label>公司名称<span style="color: var(--rose)">*</span></label>
                <input v-model="form.companyName" type="text" />
              </div>
              <div class="full">
                <label>详细地址<span style="color: var(--rose)">*</span></label>
                <input v-model="form.address" type="text" />
              </div>
              <div class="form-section-h" style="margin-top: 4px">地图定位（小程序房源详情底部展示）</div>
              <div>
                <label>纬度 WGS84<span style="color: var(--rose)">*</span></label>
                <input v-model="form.lat" type="text" placeholder="例：23.179455" />
              </div>
              <div>
                <label>经度 WGS84<span style="color: var(--rose)">*</span></label>
                <input v-model="form.lng" type="text" placeholder="例：113.429512" />
              </div>
              <div class="full">
                <label>地图显示名称</label>
                <input v-model="form.mapTitle" type="text" />
              </div>
              <div class="full">
                <label>业主联系人</label>
                <input v-model="form.ownerContact" type="text" />
              </div>
              <div class="full">
                <label>现场必拍清单（多选）<span style="color: var(--rose)">*</span></label>
                <div class="chip-toggle" data-multi style="margin-top: 6px">
                  <span
                    v-for="p in photoOptions"
                    :key="p"
                    :class="{ on: form.photoChecklist?.includes(p) }"
                    @click="toggle(form.photoChecklist, p)"
                    >{{ p }}</span
                  >
                </div>
              </div>
              <div class="full">
                <label>媒体 URL（图片 · 短视频）<span style="color: var(--rose)">*</span></label>
                <textarea v-model="form.mediaUrls" rows="3" />
              </div>
            </div>
          </div>

          <div class="prop-admin-panel" :class="{ active: tab === 1 }">
            <div class="form-grid" style="margin-top: 0">
              <div class="form-section-h">2. 土地与建筑规格</div>
              <div>
                <label>土地（亩）<span style="color: var(--rose)">*</span></label>
                <input v-model.number="form.landMu" type="number" step="0.01" />
              </div>
              <div>
                <label>实际土地（亩）</label>
                <input v-model.number="form.actualLandMu" type="number" step="0.01" />
              </div>
              <div>
                <label>建筑面积（㎡）</label>
                <input v-model.number="form.buildingArea" type="number" />
              </div>
              <div>
                <label>实际使用面积（㎡）</label>
                <input v-model.number="form.actualUseArea" type="number" />
              </div>
              <div>
                <label>总层数（层）</label>
                <input v-model.number="form.floors" type="number" />
              </div>
              <div>
                <label>承重能力（吨/m²）</label>
                <input v-model.number="form.loadPerSqm" type="number" step="0.1" />
              </div>
              <div class="full">
                <label>车间长宽高（米）</label>
                <input v-model="form.workshopSize" type="text" />
              </div>
              <div class="full">
                <label>承重注明区域</label>
                <input v-model="form.loadNote" type="text" />
              </div>
              <div class="full">
                <label>结构类型（多选）</label>
                <div class="chip-toggle" data-multi style="margin-top: 6px">
                  <span
                    v-for="s in structureOptions"
                    :key="s"
                    :class="{ on: form.structureTypes?.includes(s) }"
                    @click="toggle(form.structureTypes, s)"
                    >{{ s }}</span
                  >
                </div>
              </div>
              <div class="full">
                <label>结构 · 其他说明</label>
                <input v-model="form.structureOther" type="text" placeholder="选其他时填写" />
              </div>

              <div class="form-section-h">3. 电力与货运设施</div>
              <div>
                <label>电力总容量（kVA）<span style="color: var(--rose)">*</span></label>
                <input v-model.number="form.powerKva" type="number" />
              </div>
              <div>
                <label>现有变压器（台）</label>
                <input v-model.number="form.transformers" type="number" />
              </div>
              <div>
                <label>货梯（台）</label>
                <input v-model.number="form.freightLifts" type="number" />
              </div>
              <div>
                <label>货梯载重（吨）</label>
                <input v-model.number="form.liftLoadT" type="number" step="0.1" />
              </div>
              <div class="full">
                <label>货梯长宽高（米）</label>
                <input v-model="form.liftDims" type="text" />
              </div>
              <div>
                <label>装卸平台高度（cm）</label>
                <input v-model.number="form.platformHeightCm" type="number" />
              </div>
              <div>
                <label>货车转弯半径（米）</label>
                <input v-model.number="form.turnRadiusM" type="number" step="0.1" />
              </div>

              <div class="form-section-h">4. 周边配套<span style="color: var(--rose)">*</span></div>
              <div>
                <label>宿舍 · 园区内租金（元/房）</label>
                <input v-model.number="form.dormRent" type="number" placeholder="可选" />
              </div>
              <div>
                <label>宿舍 · 周边距离（公里）</label>
                <input v-model.number="form.dormDistanceKm" type="number" step="0.1" placeholder="可选" />
              </div>
              <div>
                <label>餐饮 / 便利店</label>
                <select v-model="form.dining" style="margin-top: 5px">
                  <option>集中</option>
                  <option>分散</option>
                  <option>缺乏</option>
                </select>
              </div>
              <div>
                <label>公交 / 地铁最近站点</label>
                <input v-model="form.transitStation" type="text" />
              </div>
              <div>
                <label>站点距离（米）</label>
                <input v-model.number="form.stationDistanceM" type="number" />
              </div>

              <div class="form-section-h">5. 使用情况<span style="color: var(--rose)">*</span></div>
              <div>
                <label>自用（㎡）</label>
                <input v-model.number="form.selfUseSqm" type="number" />
              </div>
              <div>
                <label>租金估算（元/年）</label>
                <input v-model.number="form.rentEstimateYear" type="number" />
              </div>
              <div>
                <label>共租（家）</label>
                <input v-model.number="form.coTenantCount" type="number" />
              </div>
              <div>
                <label>年租金（元/年）</label>
                <input v-model.number="form.annualRent" type="number" placeholder="共租时" />
              </div>
              <div class="full">
                <label>租客公司名称</label>
                <input v-model="form.tenantCompanies" type="text" placeholder="多家顿号分隔" />
              </div>
              <div>
                <label>合同还有（年）</label>
                <input v-model.number="form.contractYearsLeft" type="number" step="0.1" />
              </div>
              <div>
                <label>厂房全部腾空（月）</label>
                <input v-model.number="form.vacantMonths" type="number" />
              </div>
              <div class="full">
                <label>使用情况备注</label>
                <textarea v-model="form.usageRemark" rows="2" />
              </div>
            </div>
          </div>

          <div class="prop-admin-panel" :class="{ active: tab === 2 }">
            <div class="form-grid" style="margin-top: 0">
              <div class="form-section-h">7. 产权性质<span style="color: var(--rose)">*</span></div>
              <div class="full">
                <label>产权性质（多选）</label>
                <div class="chip-toggle" data-multi style="margin-top: 6px">
                  <span
                    v-for="r in rightsOptions"
                    :key="r"
                    :class="{ on: form.propertyRights?.includes(r) }"
                    @click="toggle(form.propertyRights, r)"
                    >{{ r }}</span
                  >
                </div>
              </div>
              <div class="full">
                <label>产权 · 其他说明</label>
                <input v-model="form.propertyRightsOther" type="text" />
              </div>
              <div class="full">
                <label>土地用途（多选）</label>
                <div class="chip-toggle" data-multi style="margin-top: 6px">
                  <span
                    v-for="u in landUseOptions"
                    :key="u"
                    :class="{ on: form.landUse?.includes(u) }"
                    @click="toggle(form.landUse, u)"
                    >{{ u }}</span
                  >
                </div>
              </div>
              <div class="full">
                <label>土地用途 · 其他</label>
                <input v-model="form.landUseOther" type="text" />
              </div>
              <div class="full">
                <label>证件齐全（多选）</label>
                <div class="chip-toggle" data-multi style="margin-top: 6px">
                  <span
                    v-for="c in certOptions"
                    :key="c"
                    :class="{ on: form.certificates?.includes(c) }"
                    @click="toggle(form.certificates, c)"
                    >{{ c }}</span
                  >
                </div>
              </div>
              <div>
                <label>抵押 / 纠纷</label>
                <select v-model="form.mortgageDispute" style="margin-top: 5px">
                  <option>无</option>
                  <option>有</option>
                </select>
              </div>
              <div class="full">
                <label>抵押 / 纠纷说明</label>
                <textarea v-model="form.mortgageNote" rows="2" />
              </div>

              <div class="form-section-h">8. 交易条款<span style="color: var(--rose)">*</span> · 税费</div>
              <div>
                <label>房东心里价位（万）</label>
                <input v-model.number="form.landlordPriceWan" type="number" step="0.01" />
              </div>
              <div>
                <label>厂房交易方式</label>
                <input v-model="form.tradeMode" type="text" />
              </div>
              <div class="full">
                <label>交易税费大概金额</label>
                <input v-model="form.taxFeeNote" type="text" placeholder="金额或区间" />
              </div>

              <div class="form-section-h">9. 行业限制</div>
              <div class="full">
                <label>允许产业类型</label>
                <input v-model="form.allowedIndustries" type="text" />
              </div>
              <div class="full">
                <label>特殊限制</label>
                <textarea v-model="form.specialLimits" rows="2" />
              </div>

              <div class="form-section-h">10. 消防与安全</div>
              <div class="full">
                <label>消防系统（多选）</label>
                <div class="chip-toggle" data-multi style="margin-top: 6px">
                  <span
                    v-for="f in fireOptions"
                    :key="f"
                    :class="{ on: form.fireSystems?.includes(f) }"
                    @click="toggle(form.fireSystems, f)"
                    >{{ f }}</span
                  >
                </div>
              </div>
              <div class="full">
                <label>消防 · 其他</label>
                <input v-model="form.fireOther" type="text" />
              </div>
              <div>
                <label>通过验收</label>
                <select v-model="form.firePass" style="margin-top: 5px">
                  <option>是</option>
                  <option>否</option>
                </select>
              </div>
              <div>
                <label>监控覆盖</label>
                <select v-model="form.monitorCoverage" style="margin-top: 5px">
                  <option>全厂区</option>
                  <option>部分区域</option>
                </select>
              </div>
              <div class="full">
                <label>消防未通过原因</label>
                <input v-model="form.fireFailReason" type="text" />
              </div>

              <div class="form-section-h">11. 物流便捷度</div>
              <div>
                <label>最近高速口（km）</label>
                <input v-model.number="form.highwayKm" type="number" step="0.1" />
              </div>
              <div>
                <label>港口/机场（km）</label>
                <input v-model.number="form.portAirportKm" type="number" step="0.1" />
              </div>
              <div class="full">
                <label>周边道路限高/限重</label>
                <input v-model="form.roadLimits" type="text" />
              </div>
              <div>
                <label>高峰期拥堵</label>
                <select v-model="form.rushHour" style="margin-top: 5px">
                  <option>无</option>
                  <option>轻度</option>
                  <option>严重</option>
                </select>
              </div>

              <div class="form-section-h">12. 政策支持</div>
              <div>
                <label>地方产业补贴</label>
                <select v-model="form.subsidy" style="margin-top: 5px">
                  <option>无</option>
                  <option>有</option>
                </select>
              </div>
              <div class="full">
                <label>补贴具体说明</label>
                <input v-model="form.subsidyDetail" type="text" />
              </div>
              <div class="full">
                <label>税收优惠</label>
                <input v-model="form.taxBenefit" type="text" />
              </div>

              <div class="form-section-h">13. 环保与能源</div>
              <div class="full">
                <label>环评等级</label>
                <input v-model="form.envLevel" type="text" />
              </div>
              <div>
                <label>排污许可证</label>
                <select v-model="form.dischargePermit" style="margin-top: 5px">
                  <option>有</option>
                  <option>无</option>
                </select>
              </div>
              <div>
                <label>光伏安装</label>
                <select v-model="form.solar" style="margin-top: 5px">
                  <option>可接入</option>
                  <option>不可接入</option>
                </select>
              </div>

              <div class="form-section-h">备注栏</div>
              <div class="full">
                <label>厂房亮点</label>
                <textarea v-model="form.highlights" rows="2" />
              </div>
              <div class="full">
                <label>潜在风险提示</label>
                <textarea v-model="form.risks" rows="2" />
              </div>
              <div class="full">
                <label>厂房评估建议</label>
                <textarea v-model="form.assessment" rows="2" />
              </div>

              <div class="form-section-h">内部跟进（小程序同源）</div>
              <div>
                <label>对外状态</label>
                <select v-model="form.externalStatus">
                  <option>待租</option>
                  <option>待售</option>
                  <option>意向中</option>
                  <option>下架封存</option>
                </select>
              </div>
              <div>
                <label>租售类型<span style="color: var(--rose)">*</span></label>
                <select v-model="form.rentSaleType">
                  <option>出租</option>
                  <option>出售</option>
                  <option>租售皆可</option>
                </select>
              </div>
              <div>
                <label>租金挂牌（元/㎡·月）</label>
                <input v-model.number="form.rentListSqm" type="number" />
              </div>
              <div>
                <label>物业费（元/㎡·月）</label>
                <input v-model.number="form.propertyFee" type="number" step="0.1" />
              </div>
              <div>
                <label>联系人姓名<span style="color: var(--rose)">*</span></label>
                <input v-model="form.contactName" type="text" />
              </div>
              <div>
                <label>联系人电话<span style="color: var(--rose)">*</span></label>
                <input v-model="form.contactPhone" type="text" />
              </div>
              <div class="full">
                <label>看房预约备注</label>
                <textarea v-model="form.viewingNote" rows="2" />
              </div>
              <div class="full">
                <label>内部备注（不对客户）</label>
                <textarea v-model="form.internalNote" rows="2" />
              </div>
            </div>
          </div>
        </div>
        <div class="modal-prop-foot">
          <button type="button" class="btn" @click="close">关闭</button>
          <button type="button" class="btn btn-primary" @click="onSave">{{ mode === 'edit' ? '保存修改' : '保存快照' }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
