export const MAX_FOLLOW_IMAGES_PER_PICK = 5
export const MAX_FOLLOW_IMAGES = 50
export const MAX_FOLLOW_AUDIOS = 20
export const FOLLOW_UPLOAD_FOLDER = 'properties/follow-up'

export type { CustomerFollowEntry as PropertyFollowEntry } from '@/lib/customerFollowTimeline'
export {
  formatFollowDisplayLine,
  normalizeTimelineEntry,
  toFollowEntry,
} from '@/lib/customerFollowTimeline'
