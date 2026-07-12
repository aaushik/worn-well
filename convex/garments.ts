import { query } from './_generated/server'

export const listForDemoUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db.query('users').withIndex('by_external_id', (q) => q.eq('externalId', 'demo-user')).unique()
    if (!user) return []
    return ctx.db.query('garments').withIndex('by_user', (q) => q.eq('userId', user._id)).collect()
  },
})
