import { mutation } from './_generated/server'

export const clearDemoCorpus = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db.query('users').withIndex('by_external_id', (q) => q.eq('externalId', 'demo-user')).unique()
    if (!user) return { removed: 0 }
    const outfits = await ctx.db.query('outfits').withIndex('by_user', (q) => q.eq('userId', user._id)).collect()
    const garments = await ctx.db.query('garments').withIndex('by_user', (q) => q.eq('userId', user._id)).collect()
    for (const garment of garments) await ctx.db.delete(garment._id)
    for (const outfit of outfits) {
      if (outfit.imageStorageId) await ctx.storage.delete(outfit.imageStorageId)
      await ctx.db.delete(outfit._id)
    }
    return { outfitsRemoved: outfits.length, garmentsRemoved: garments.length }
  },
})

const samples = [
  ['Coffee date', 'Relaxed', 8, 9, 'The proportions felt effortless', ''],
  ['Work presentation', 'Focused', 9, 7, 'The structured layer felt confident', 'Shoes became uncomfortable'],
  ['Weekend lunch', 'Playful', 8, 10, 'The color combination', ''],
  ['Gallery opening', 'Curious', 9, 8, 'Interesting silhouette without feeling overdressed', ''],
] as const

export const demoCorpus = mutation({
  args: {},
  handler: async (ctx) => {
    let user = await ctx.db.query('users').withIndex('by_external_id', (q) => q.eq('externalId', 'demo-user')).unique()
    const userId = user?._id ?? await ctx.db.insert('users', {
      externalId: 'demo-user', displayName: 'Demo Stylist', wardrobePlan: 'free',
    })
    const existing = await ctx.db.query('outfits').withIndex('by_user', (q) => q.eq('userId', userId)).collect()
    if (existing.length) return { inserted: 0 }

    for (const [occasion, moodBefore, confidenceAfter, comfort, liked, disliked] of samples) {
      await ctx.db.insert('outfits', {
        userId,
        sampleImageUrl: `https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80`,
        occasion, moodBefore, confidenceAfter, comfort, liked, disliked,
        wornAt: '2026-07-12', status: 'sample',
      })
    }
    return { inserted: samples.length }
  },
})
