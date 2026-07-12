import { mutation, query } from './_generated/server'
import { ConvexError, v } from 'convex/values'

const FREE_OUTFIT_LIMIT = 10
const DEMO_EXTERNAL_ID = 'demo-user'

async function getDemoUser(ctx: any) {
  const user = await ctx.db
    .query('users')
    .withIndex('by_external_id', (q: any) => q.eq('externalId', DEMO_EXTERNAL_ID))
    .unique()
  if (!user) throw new ConvexError({ code: 'USER_NOT_FOUND' })
  return user
}

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => ctx.storage.generateUploadUrl(),
})

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_external_id', (q) => q.eq('externalId', DEMO_EXTERNAL_ID))
      .unique()
    if (!user) return []

    const outfits = await ctx.db.query('outfits').withIndex('by_user', (q) => q.eq('userId', user._id)).collect()
    const withUrls = await Promise.all(outfits.map(async (outfit) => ({
      ...outfit,
      imageUrl: outfit.imageStorageId ? await ctx.storage.getUrl(outfit.imageStorageId) : outfit.sampleImageUrl ?? null,
    })))
    return withUrls.sort((a, b) => b._creationTime - a._creationTime)
  },
})

export const create = mutation({
  args: {
    imageStorageId: v.id('_storage'),
    occasion: v.string(),
    moodBefore: v.string(),
    confidenceAfter: v.number(),
    comfort: v.number(),
    liked: v.string(),
    disliked: v.string(),
    wornAt: v.string(),
  },
  handler: async (ctx, input) => {
    const user = await getDemoUser(ctx)
    const outfitCount = (await ctx.db.query('outfits').withIndex('by_user', (q: any) => q.eq('userId', user._id)).collect()).length

    if (user.wardrobePlan === 'free' && outfitCount >= FREE_OUTFIT_LIMIT) {
      throw new ConvexError({ code: 'WARDROBE_LIMIT_REACHED', limit: FREE_OUTFIT_LIMIT })
    }

    if (!input.occasion.trim() || !input.moodBefore.trim() || !input.liked.trim()) {
      throw new ConvexError({ code: 'INVALID_OUTFIT' })
    }
    if (input.confidenceAfter < 1 || input.confidenceAfter > 10 || input.comfort < 1 || input.comfort > 10) {
      throw new ConvexError({ code: 'INVALID_RATING' })
    }

    return ctx.db.insert('outfits', { ...input, userId: user._id, status: 'confirmed' })
  },
})

export const createCaptured = mutation({
  args: {
    imageStorageId: v.id('_storage'),
    evidenceLevel: v.union(v.literal('photo_only'), v.literal('quick_context'), v.literal('conversational')),
    occasion: v.optional(v.string()),
    moodBefore: v.optional(v.string()),
    confidenceAfter: v.optional(v.number()),
    comfort: v.optional(v.number()),
    liked: v.optional(v.string()),
    disliked: v.optional(v.string()),
    wornAt: v.string(),
  },
  handler: async (ctx, input) => {
    const user = await getDemoUser(ctx)
    const outfitCount = (await ctx.db.query('outfits').withIndex('by_user', (q: any) => q.eq('userId', user._id)).collect()).length
    if (user.wardrobePlan === 'free' && outfitCount >= FREE_OUTFIT_LIMIT) {
      throw new ConvexError({ code: 'WARDROBE_LIMIT_REACHED', limit: FREE_OUTFIT_LIMIT })
    }
    for (const rating of [input.comfort, input.confidenceAfter]) {
      if (rating !== undefined && (rating < 1 || rating > 10)) throw new ConvexError({ code: 'INVALID_RATING' })
    }
    return ctx.db.insert('outfits', { ...input, userId: user._id, status: 'confirmed' })
  },
})
