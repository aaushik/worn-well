import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

const DEMO_EXTERNAL_ID = 'demo-user'

export const current = query({
  args: {},
  handler: async (ctx) => ctx.db
    .query('users')
    .withIndex('by_external_id', (q) => q.eq('externalId', DEMO_EXTERNAL_ID))
    .unique(),
})

export const ensureDemoUser = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_external_id', (q) => q.eq('externalId', DEMO_EXTERNAL_ID))
      .unique()

    if (existing) return existing._id
    return ctx.db.insert('users', {
      externalId: DEMO_EXTERNAL_ID,
      displayName: 'Demo Stylist',
      wardrobePlan: 'free',
    })
  },
})

export const setWardrobePlanForDemo = mutation({
  args: { plan: v.union(v.literal('free'), v.literal('unlimited')) },
  handler: async (ctx, { plan }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_external_id', (q) => q.eq('externalId', DEMO_EXTERNAL_ID))
      .unique()
    if (!user) throw new Error('Demo user has not been created')
    await ctx.db.patch(user._id, { wardrobePlan: plan })
  },
})
