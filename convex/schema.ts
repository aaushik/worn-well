import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    externalId: v.string(),
    displayName: v.string(),
    email: v.optional(v.string()),
    wardrobePlan: v.union(v.literal('free'), v.literal('unlimited')),
  }).index('by_external_id', ['externalId']),

  outfits: defineTable({
    userId: v.id('users'),
    imageStorageId: v.optional(v.id('_storage')),
    sampleImageUrl: v.optional(v.string()),
    occasion: v.optional(v.string()),
    moodBefore: v.optional(v.string()),
    confidenceAfter: v.optional(v.number()),
    comfort: v.optional(v.number()),
    liked: v.optional(v.string()),
    disliked: v.optional(v.string()),
    wornAt: v.string(),
    evidenceLevel: v.optional(v.union(v.literal('photo_only'), v.literal('quick_context'), v.literal('conversational'))),
    analysisStatus: v.optional(v.union(v.literal('pending'), v.literal('analyzing'), v.literal('ready'), v.literal('failed'))),
    analysisError: v.optional(v.string()),
    status: v.union(v.literal('confirmed'), v.literal('sample')),
  }).index('by_user', ['userId']),

  garments: defineTable({
    userId: v.id('users'),
    sourceOutfitId: v.id('outfits'),
    label: v.string(),
    category: v.union(v.literal('top'), v.literal('bottom'), v.literal('dress'), v.literal('outerwear'), v.literal('footwear'), v.literal('accessory'), v.literal('unknown')),
    subtype: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    secondaryColors: v.optional(v.array(v.string())),
    colors: v.array(v.string()),
    pattern: v.optional(v.string()),
    fit: v.optional(v.string()),
    silhouette: v.optional(v.string()),
    layerPosition: v.optional(v.string()),
    confidence: v.optional(v.number()),
    canonicalGarmentId: v.optional(v.id('garments')),
    confirmed: v.boolean(),
  }).index('by_user', ['userId']).index('by_outfit', ['sourceOutfitId']),

  outfitGarments: defineTable({
    outfitId: v.id('outfits'),
    garmentId: v.id('garments'),
  }).index('by_outfit', ['outfitId']),
})
