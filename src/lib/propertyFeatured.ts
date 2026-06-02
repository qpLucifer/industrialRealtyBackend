export const PROPERTY_STATUS_FOR_SALE = '待售'

export const RENT_SALE_TYPE_FOR_FEATURED = '出售'

export function isPropertyForSaleStatus(status: string | undefined | null) {
  return String(status || '').trim() === PROPERTY_STATUS_FOR_SALE
}

export function isRentSaleTypeForFeatured(rentSaleType: string | undefined | null) {
  return String(rentSaleType || '').trim() === RENT_SALE_TYPE_FOR_FEATURED
}

export function showFeaturedOption(
  externalStatus: string | undefined | null,
  rentSaleType?: string | undefined | null,
) {
  return isPropertyForSaleStatus(externalStatus) || isRentSaleTypeForFeatured(rentSaleType)
}
