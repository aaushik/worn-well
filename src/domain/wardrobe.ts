import { z } from 'zod'

export const FREE_OUTFIT_LIMIT = 10
export const STYLIST_UNLOCK_COUNT = 3

export const quickOutfitInputSchema = z.object({
  evidenceLevel: z.enum(['photo_only', 'quick_context', 'conversational']),
  occasion: z.string().trim().min(1).optional(),
  moodBefore: z.string().trim().min(1).optional(),
  confidenceAfter: z.number().int().min(1).max(10).optional(),
  comfort: z.number().int().min(1).max(10).optional(),
  liked: z.string().trim().min(1).optional(),
  disliked: z.string().trim().optional(),
  wornAt: z.iso.date(),
})

export const outfitInputSchema = z.object({
  occasion: z.string().trim().min(2, 'Add an occasion'),
  moodBefore: z.string().trim().min(2, 'Describe your mood'),
  confidenceAfter: z.number().int().min(1).max(10),
  comfort: z.number().int().min(1).max(10),
  liked: z.string().trim().min(2, 'Add one thing you liked'),
  disliked: z.string().trim().max(500),
  wornAt: z.iso.date(),
})

export type OutfitInput = z.infer<typeof outfitInputSchema>
export type WardrobePlan = 'free' | 'unlimited'

export function getWardrobeReadiness(outfitCount: number) {
  const normalizedCount = Math.max(0, outfitCount)
  return {
    stylistReady: normalizedCount >= STYLIST_UNLOCK_COUNT,
    remainingToUnlock: Math.max(0, STYLIST_UNLOCK_COUNT - normalizedCount),
    freeSlotsRemaining: Math.max(0, FREE_OUTFIT_LIMIT - normalizedCount),
  }
}

export function canCreateOutfit({ outfitCount, wardrobePlan }: { outfitCount: number; wardrobePlan: WardrobePlan }) {
  if (wardrobePlan === 'free' && outfitCount >= FREE_OUTFIT_LIMIT) {
    return { allowed: false as const, code: 'WARDROBE_LIMIT_REACHED' as const }
  }
  return { allowed: true as const }
}
