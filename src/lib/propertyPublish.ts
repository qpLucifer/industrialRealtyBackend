/** Align admin property wizard with miniapp `propertyPublish.ts`. */

export const PUBLISH_STEP_NAMES = [
  '基础分类',
  '地图定位',
  '图片视频',
  '土地建筑',
  '电力配套',
  '产权合规',
  '政策亮点',
  '挂牌联系',
] as const

export const PHOTO_OPTIONS = ['门口形象照', '路口进出照', '车间照片', '货梯', '厂房屋顶'] as const
export const STRUCTURE_OPTIONS = ['钢构', '框架', '其他'] as const
export const RIGHTS_OPTIONS = ['国有土地', '出让', '划拨', '集体土地', '其他'] as const
export const LAND_USE_OPTIONS = ['工业', '仓储', '其他'] as const
export const CERT_OPTIONS = ['房产证', '土地证', '消防验收证', '环保批文'] as const
export const FIRE_OPTIONS = ['喷淋', '烟感', '消防栓', '其他'] as const
export const DINING_OPTIONS = ['集中', '分散', '缺乏'] as const
export const YES_NO = ['无', '有'] as const
export const FIRE_PASS = ['是', '否'] as const
export const DISCHARGE = ['有', '无'] as const
export const SOLAR = ['可接入', '不可接入'] as const
export const RENT_SALE = ['出租', '出售', '租售皆可'] as const
export const MONITOR = ['全厂区', '部分区域'] as const
export const RUSH_HOUR = ['无', '轻度', '严重'] as const
