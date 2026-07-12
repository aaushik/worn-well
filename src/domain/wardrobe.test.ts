import { canCreateOutfit, getWardrobeReadiness, outfitInputSchema, quickOutfitInputSchema } from './wardrobe'

describe('wardrobe rules', () => {
  it('unlocks grounded recommendations at three completed outfits', () => {
    expect(getWardrobeReadiness(2)).toMatchObject({ stylistReady: false, remainingToUnlock: 1 })
    expect(getWardrobeReadiness(3)).toMatchObject({ stylistReady: true, remainingToUnlock: 0 })
  })

  it('allows ten free outfits but blocks outfit eleven', () => {
    expect(canCreateOutfit({ outfitCount: 9, wardrobePlan: 'free' })).toEqual({ allowed: true })
    expect(canCreateOutfit({ outfitCount: 10, wardrobePlan: 'free' })).toEqual({
      allowed: false,
      code: 'WARDROBE_LIMIT_REACHED',
    })
    expect(canCreateOutfit({ outfitCount: 10, wardrobePlan: 'unlimited' })).toEqual({ allowed: true })
  })

  it('accepts a photo-only log without inventing context', () => {
    expect(quickOutfitInputSchema.parse({ evidenceLevel: 'photo_only', wornAt: '2026-07-12' })).toEqual({
      evidenceLevel: 'photo_only',
      wornAt: '2026-07-12',
    })
  })

  it('requires meaningful feedback and bounded ratings', () => {
    const result = outfitInputSchema.safeParse({
      occasion: 'Coffee date',
      moodBefore: 'A little nervous',
      confidenceAfter: 8,
      comfort: 9,
      liked: 'The relaxed shape',
      disliked: '',
      wornAt: '2026-07-12',
    })

    expect(result.success).toBe(true)
    expect(outfitInputSchema.safeParse({ occasion: '', confidenceAfter: 11, comfort: 0 }).success).toBe(false)
  })
})
