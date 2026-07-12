import { ConvexError, v } from 'convex/values'
import { mutation, query } from './_generated/server'

const DEMO_EXTERNAL_ID = 'demo-user'
const categoryValidator = v.union(
  v.literal('top'),
  v.literal('bottom'),
  v.literal('dress'),
  v.literal('outerwear'),
  v.literal('footwear'),
  v.literal('accessory'),
  v.literal('unknown'),
)

async function getDemoUser(ctx: any) {
  const user = await ctx.db.query('users').withIndex('by_external_id', (q: any) => q.eq('externalId', DEMO_EXTERNAL_ID)).unique()
  if (!user) throw new ConvexError({ code: 'USER_NOT_FOUND' })
  return user
}

export const listForDemoUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db.query('users').withIndex('by_external_id', (q) => q.eq('externalId', DEMO_EXTERNAL_ID)).unique()
    if (!user) return []
    return ctx.db.query('garments').withIndex('by_user', (q) => q.eq('userId', user._id)).collect()
  },
})

export const update = mutation({
  args: {
    garmentId: v.id('garments'),
    label: v.string(),
    category: categoryValidator,
    subtype: v.string(),
    primaryColor: v.string(),
    pattern: v.string(),
    fit: v.string(),
  },
  handler: async (ctx, { garmentId, ...changes }) => {
    const user = await getDemoUser(ctx)
    const garment = await ctx.db.get(garmentId)
    if (!garment || garment.userId !== user._id) throw new ConvexError({ code: 'GARMENT_NOT_FOUND' })
    if (garment.confirmed) throw new ConvexError({ code: 'GARMENT_ALREADY_CONFIRMED' })
    const values = Object.values(changes)
    if (values.some((value) => !value.trim())) throw new ConvexError({ code: 'INVALID_GARMENT' })
    await ctx.db.patch(garmentId, {
      ...changes,
      colors: [changes.primaryColor, ...(garment.secondaryColors ?? [])].filter((color) => color !== 'unknown'),
    })
  },
})

export const addManual = mutation({
  args: {
    outfitId: v.id('outfits'),
    label: v.string(),
    category: categoryValidator,
    subtype: v.string(),
    primaryColor: v.string(),
    pattern: v.string(),
    fit: v.string(),
  },
  handler: async (ctx, { outfitId, ...input }) => {
    const user = await getDemoUser(ctx)
    const outfit = await ctx.db.get(outfitId)
    if (!outfit || outfit.userId !== user._id) throw new ConvexError({ code: 'OUTFIT_NOT_FOUND' })
    if (Object.values(input).some((value) => !value.trim())) throw new ConvexError({ code: 'INVALID_GARMENT' })
    return ctx.db.insert('garments', {
      userId: user._id,
      sourceOutfitId: outfitId,
      ...input,
      secondaryColors: [],
      colors: input.primaryColor === 'unknown' ? [] : [input.primaryColor],
      silhouette: 'unknown',
      layerPosition: 'unknown',
      confidence: 1,
      confirmed: false,
    })
  },
})

export const remove = mutation({
  args: { garmentId: v.id('garments') },
  handler: async (ctx, { garmentId }) => {
    const user = await getDemoUser(ctx)
    const garment = await ctx.db.get(garmentId)
    if (!garment || garment.userId !== user._id) throw new ConvexError({ code: 'GARMENT_NOT_FOUND' })
    if (garment.confirmed) throw new ConvexError({ code: 'GARMENT_ALREADY_CONFIRMED' })
    await ctx.db.delete(garmentId)
  },
})

export const confirmForOutfit = mutation({
  args: { outfitId: v.id('outfits') },
  handler: async (ctx, { outfitId }) => {
    const user = await getDemoUser(ctx)
    const outfit = await ctx.db.get(outfitId)
    if (!outfit || outfit.userId !== user._id) throw new ConvexError({ code: 'OUTFIT_NOT_FOUND' })
    const garments = await ctx.db.query('garments').withIndex('by_outfit', (q: any) => q.eq('sourceOutfitId', outfitId)).collect()
    if (!garments.length) throw new ConvexError({ code: 'NO_GARMENTS_TO_CONFIRM' })
    await Promise.all(garments.map((garment) => ctx.db.patch(garment._id, { confirmed: true })))
    return { count: garments.length }
  },
})
