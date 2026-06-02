export const PROPERTY_STATUS_FOR_SALE = '待售'

export function isPropertyForSaleStatus(status: string | undefined | null) {
  return String(status || '').trim() === PROPERTY_STATUS_FOR_SALE
}

export function showFeaturedOption(externalStatus: string | undefined | null) {
  return isPropertyForSaleStatus(externalStatus)
}
