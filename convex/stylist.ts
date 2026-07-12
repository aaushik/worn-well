/// <reference types="node" />

import { ConvexError, v } from 'convex/values'
import { action, internalMutation, internalQuery } from './_generated/server'
import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { isCompleteLook, parseStylistRecommendation } from './lib/stylist'
import { stylistRecommendationSchema, type StylistRecommendation } from '../src/domain/stylistRecommendation'

const DEMO_EXTERNAL_ID = 'demo-user'
const MINIMUM_OUTFITS = 3
const DAILY_RECOMMENDATION_LIMIT = 20
const MAX_REQUEST_LENGTH = 160
const MAX_PROMPT_GARMENTS = 40
const MAX_GARMENT_FIELD_LENGTH = 80
const MAX_PROMPT_LENGTH = 30_000

function clip(value: string, max = MAX_GARMENT_FIELD_LENGTH) {
  return value.slice(0, max)
}

type GroundedGarment = {
  id: string
  label: string
  category: 'top' | 'bottom' | 'dress' | 'outerwear' | 'footwear' | 'accessory' | 'unknown'
  subtype: string
  primaryColor: string
  secondaryColors: string[]
  pattern: string
  fit: string
  silhouette: string
}

type GroundedWardrobe = { userId: Id<'users'>; outfitCount: number; confirmed: GroundedGarment[]; provisionalCount: number }
type StylistActionResult = StylistRecommendation & { garments: GroundedGarment[]; provisionalGarmentCount: number }

export const getGroundedWardrobe = internalQuery({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db.query('users').withIndex('by_external_id', (q) => q.eq('externalId', DEMO_EXTERNAL_ID)).unique()
    if (!user) throw new ConvexError({ code: 'USER_NOT_FOUND', message: 'The demo wardrobe is not ready.' })

    const [outfits, garments] = await Promise.all([
      ctx.db.query('outfits').withIndex('by_user', (q) => q.eq('userId', user._id)).collect(),
      ctx.db.query('garments').withIndex('by_user', (q) => q.eq('userId', user._id)).collect(),
    ])
    return {
      userId: user._id,
      outfitCount: outfits.filter((outfit) => outfit.status === 'confirmed').length,
      confirmed: garments.filter((garment) => garment.confirmed).slice(0, MAX_PROMPT_GARMENTS).map((garment) => ({
        id: String(garment._id),
        label: clip(garment.label),
        category: garment.category,
        subtype: clip(garment.subtype ?? 'unknown'),
        primaryColor: clip(garment.primaryColor ?? garment.colors[0] ?? 'unknown'),
        secondaryColors: (garment.secondaryColors ?? garment.colors.slice(1)).slice(0, 4).map((color) => clip(color)),
        pattern: clip(garment.pattern ?? 'unknown'),
        fit: clip(garment.fit ?? 'unknown'),
        silhouette: clip(garment.silhouette ?? 'unknown'),
      })),
      provisionalCount: garments.filter((garment) => !garment.confirmed).length,
    }
  },
})

export const consumeDailyQuota = internalMutation({
  args: { userId: v.id('users'), day: v.string() },
  handler: async (ctx, { userId, day }) => {
    const usage = await ctx.db.query('stylistUsage').withIndex('by_user_day', (q) => q.eq('userId', userId).eq('day', day)).unique()
    if (usage && usage.count >= DAILY_RECOMMENDATION_LIMIT) {
      throw new ConvexError({ code: 'DAILY_LIMIT', message: 'The demo stylist has reached its daily recommendation limit.' })
    }
    if (usage) await ctx.db.patch(usage._id, { count: usage.count + 1 })
    else await ctx.db.insert('stylistUsage', { userId, day, count: 1 })
  },
})

const responseSchema = {
  type: 'object',
  required: ['looks'],
  properties: {
    looks: {
      type: 'array',
      items: {
        type: 'object',
        required: ['garmentIds'],
        properties: { garmentIds: { type: 'array', minItems: 1, maxItems: 4, items: { type: 'string' } } },
      },
    },
  },
}

export const recommend = action({
  args: {
    occasion: v.string(),
    weather: v.optional(v.string()),
    preference: v.optional(v.string()),
  },
  handler: async (ctx, input): Promise<StylistActionResult> => {
    const occasion = input.occasion.trim()
    if (!occasion) throw new ConvexError({ code: 'OCCASION_REQUIRED', message: 'Tell the stylist where you are going.' })
    if ([occasion, input.weather ?? '', input.preference ?? ''].some((value) => value.length > MAX_REQUEST_LENGTH)) {
      throw new ConvexError({ code: 'REQUEST_TOO_LONG', message: `Keep each request field under ${MAX_REQUEST_LENGTH} characters.` })
    }

    const wardrobe: GroundedWardrobe = await ctx.runQuery(internal.stylist.getGroundedWardrobe, {})
    if (wardrobe.outfitCount < MINIMUM_OUTFITS) {
      throw new ConvexError({ code: 'STYLIST_LOCKED', message: `Log ${MINIMUM_OUTFITS - wardrobe.outfitCount} more outfit(s) first.` })
    }
    if (wardrobe.confirmed.length === 0) {
      throw new ConvexError({ code: 'NO_CONFIRMED_GARMENTS', message: 'Confirm your extracted garments before asking the stylist.' })
    }
    if (wardrobe.provisionalCount > 0) {
      throw new ConvexError({ code: 'REVIEW_REQUIRED', message: `Review and confirm ${wardrobe.provisionalCount} provisional garment(s) so the stylist can use all three outfits.` })
    }

    await ctx.runMutation(internal.stylist.consumeDailyQuota, {
      userId: wardrobe.userId,
      day: new Date().toISOString().slice(0, 10),
    })

    const apiKey = process.env.GEMINI_API_KEY?.trim()
    if (!apiKey) throw new ConvexError({ code: 'VISION_NOT_CONFIGURED', message: 'Gemini is not configured.' })
    const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash'
    const prompt = [
      'You are Worn Well, a conservative personal stylist.',
      'Select 1 to 3 complete looks using ONLY garment IDs in the confirmed wardrobe JSON.',
      'Return IDs only. Do not return titles, explanations, notes, or any other prose.',
      `Request: ${JSON.stringify({ occasion, weather: input.weather?.trim() || undefined, preference: input.preference?.trim() || undefined })}`,
      `Confirmed wardrobe: ${JSON.stringify(wardrobe.confirmed)}`,
    ].join('\n')
    if (prompt.length > MAX_PROMPT_LENGTH) {
      throw new ConvexError({ code: 'WARDROBE_TOO_LARGE', message: 'The confirmed wardrobe is too large to style safely.' })
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema },
      }),
    })
    if (!response.ok) throw new ConvexError({ code: 'STYLIST_FAILED', message: `Gemini recommendation failed (${response.status}).` })

    try {
      const selection = parseStylistRecommendation(await response.json(), new Set(wardrobe.confirmed.map((garment) => garment.id)))
      const byId = new Map(wardrobe.confirmed.map((garment) => [garment.id, garment]))
      const looks = selection.looks.map((look, index) => {
        const selected = look.garmentIds.map((id) => byId.get(id)!).filter(Boolean)
        if (!isCompleteLook(selected)) throw new Error('Gemini returned an incomplete outfit combination')
        const labels = selected.map((garment) => garment.label)
        return {
          title: clip(`Look ${index + 1}: ${labels.join(' + ')}`, 80),
          garmentIds: look.garmentIds,
          reason: clip(`Built for ${occasion} using only confirmed wardrobe pieces: ${labels.join(', ')}.`, 500),
          stylingNotes: selected.map((garment) => clip(`${garment.label}: ${garment.primaryColor}, ${garment.fit} fit, ${garment.pattern} pattern.`, 200)),
        }
      })
      return { ...stylistRecommendationSchema.parse({ looks }), garments: wardrobe.confirmed, provisionalGarmentCount: 0 }
    } catch (error) {
      throw new ConvexError({ code: 'STYLIST_FAILED', message: error instanceof Error ? error.message : 'Could not validate the recommendation.' })
    }
  },
})
