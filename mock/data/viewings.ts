/** Viewings + deals — maps to viewing_ledger, deal_record */

export interface ViewingRow {
  start: string
  end: string
  propertyRef: string
  customerName: string
  companions: string
  score: string
}

export interface DealRow {
  contractType: string
  amount: string
  commission: string
  invoiceType: string
  archiveStatus: string
}

export const mockViewingRows: ViewingRow[] = [
  {
    start: '05-12 14:00',
    end: '15:30',
    propertyRef: '#8821',
    customerName: '张晨',
    companions: '陈思远、王敏',
    score: 'B',
  },
]

export const mockDealRows: DealRow[] = [
  {
    contractType: '租赁合同',
    amount: '¥1,280,000',
    commission: '¥64,000',
    invoiceType: '专票',
    archiveStatus: '已归档',
  },
]
