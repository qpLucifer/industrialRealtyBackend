/** Video FAQ — maps to video_faq_entry, vod_asset, search_keywords */

export interface VideoFaqRow {
  id: string
  keywords: string
  question: string
  industry: string
  videoPath: string
  tags: { label: string; tone: 'cyan' | 'mint' | 'amber' }[]
  miniProgramSearch: boolean
  updatedAt: string
}

export const mockVideoFaqRows: VideoFaqRow[] = [
  {
    id: 'v1',
    keywords: '配电增容 周期 业主书面',
    question: '厂房配电增容一般多久？需要业主出具什么？',
    industry: '通用',
    videoPath: 'VOD / faq_20260501.mp4',
    tags: [
      { label: '验厂', tone: 'cyan' },
      { label: '高频', tone: 'mint' },
    ],
    miniProgramSearch: true,
    updatedAt: '2026-05-02',
  },
  {
    id: 'v2',
    keywords: '独门独院 环评 购地',
    question: '独门独院与环评等级不匹配时如何沟通客户预期？',
    industry: '塑业 / 机械',
    videoPath: 'VOD / faq_20260418.mp4',
    tags: [{ label: '话术', tone: 'amber' }],
    miniProgramSearch: true,
    updatedAt: '2026-04-18',
  },
  {
    id: 'v3',
    keywords: '土地 亩 容积率',
    question: '工业用地亩数与报建容积率怎么给客户举例？',
    industry: '拿地建厂',
    videoPath: 'VOD / faq_20260310.mp4',
    tags: [{ label: '政策', tone: 'cyan' }],
    miniProgramSearch: true,
    updatedAt: '2026-03-10',
  },
]
