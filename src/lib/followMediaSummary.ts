/** Collapsed label for follow-up image/audio attachments. */

export function followMediaSummary(imageCount: number, audioCount: number): string {
  const parts: string[] = []
  if (imageCount > 0) parts.push(`图片×${imageCount}`)
  if (audioCount > 0) parts.push(`语音×${audioCount}`)
  return parts.join(' ')
}

export function hasFollowMedia(imageUrls?: string[], audioUrls?: string[]): boolean {
  return (imageUrls?.length ?? 0) > 0 || (audioUrls?.length ?? 0) > 0
}
