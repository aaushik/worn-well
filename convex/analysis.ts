/// <reference types="node" />

import { ConvexError, v } from 'convex/values'
import { action, internalMutation, internalQuery } from './_generated/server'
import { internal } from './_generated/api'
import { parseGeminiGarments } from './lib/gemini'

const suggestionValidator = v.object({
  label: v.string(),
  category: v.union(v.literal('top'), v.literal('bottom'), v.literal('dress'), v.literal('outerwear'), v.literal('footwear'), v.literal('accessory'), v.literal('unknown')),
  subtype: v.string(),
  primaryColor: v.string(),
  secondaryColors: v.array(v.string()),
  pattern: v.string(),
  fit: v.string(),
  silhouette: v.string(),
  layerPosition: v.string(),
  confidence: v.number(),
  boundingBox: v.object({ x: v.number(), y: v.number(), width: v.number(), height: v.number() }),
  })

const responseSchema = {
  type: 'object',
  properties: {
    garments: {
      type: 'array',
      items: {
        type: 'object',
        required: ['label', 'category', 'subtype', 'primaryColor', 'secondaryColors', 'pattern', 'fit', 'silhouette', 'layerPosition', 'confidence', 'boundingBox'],
        properties: {
          label: { type: 'string' },
          category: { type: 'string' },
          subtype: { type: 'string' },
          primaryColor: { type: 'string' },
          secondaryColors: { type: 'array', items: { type: 'string' } },
          pattern: { type: 'string' },
          fit: { type: 'string' },
          silhouette: { type: 'string' },
          layerPosition: { type: 'string' },
          confidence: { type: 'number' },
          boundingBox: {
            type: 'object',
            required: ['x', 'y', 'width', 'height'],
            properties: {
              x: { type: 'number' }, y: { type: 'number' }, width: { type: 'number' }, height: { type: 'number' },
            },
          },
        },
      },
    },
  },
  required: ['garments'],
}

export const getAnalysisInput = internalQuery({
  args: { outfitId: v.id('outfits') },
  handler: async (ctx, { outfitId }) => {
    const outfit = await ctx.db.get(outfitId)
    if (!outfit?.imageStorageId) throw new ConvexError({ code: 'OUTFIT_IMAGE_NOT_FOUND' })
    const imageUrl = await ctx.storage.getUrl(outfit.imageStorageId)
    if (!imageUrl) throw new ConvexError({ code: 'OUTFIT_IMAGE_NOT_FOUND' })
    return { imageUrl }
  },
})

export const setAnalysisState = internalMutation({
  args: {
    outfitId: v.id('outfits'),
    status: v.union(v.literal('analyzing'), v.literal('ready'), v.literal('failed')),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { outfitId, status, error }) => {
    await ctx.db.patch(outfitId, { analysisStatus: status, analysisError: error })
  },
})

export const saveSuggestions = internalMutation({
  args: { outfitId: v.id('outfits'), suggestions: v.array(suggestionValidator) },
  handler: async (ctx, { outfitId, suggestions }) => {
    const outfit = await ctx.db.get(outfitId)
    if (!outfit) throw new ConvexError({ code: 'OUTFIT_NOT_FOUND' })

    const existing = await ctx.db.query('garments').withIndex('by_outfit', (q) => q.eq('sourceOutfitId', outfitId)).collect()
    const confirmed = existing.filter((garment) => garment.confirmed)
    if (confirmed.length > 0) {
      const available = [...confirmed]
      for (const suggestion of suggestions) {
        const matchIndex = available.findIndex((garment) => garment.category === suggestion.category)
        if (matchIndex < 0) continue
        const [match] = available.splice(matchIndex, 1)
        await ctx.db.patch(match._id, { boundingBox: suggestion.boundingBox })
      }
      await ctx.db.patch(outfitId, { analysisStatus: 'ready', analysisError: undefined })
      return
    }

    await Promise.all(existing.map((garment) => ctx.db.delete(garment._id)))

    for (const suggestion of suggestions) {
      await ctx.db.insert('garments', {
        userId: outfit.userId,
        sourceOutfitId: outfitId,
        label: suggestion.label,
        category: suggestion.category,
        subtype: suggestion.subtype,
        primaryColor: suggestion.primaryColor,
        secondaryColors: suggestion.secondaryColors,
        colors: [suggestion.primaryColor, ...suggestion.secondaryColors].filter((color) => color !== 'unknown'),
        pattern: suggestion.pattern,
        fit: suggestion.fit,
        silhouette: suggestion.silhouette,
        layerPosition: suggestion.layerPosition,
        confidence: suggestion.confidence,
        boundingBox: suggestion.boundingBox,
        confirmed: false,
      })
    }
    await ctx.db.patch(outfitId, { analysisStatus: 'ready', analysisError: undefined })
  },
})

function toBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
  }
  return btoa(binary)
}

export const analyzeOutfit = action({
  args: { outfitId: v.id('outfits') },
  handler: async (ctx, { outfitId }): Promise<{ count: number }> => {
    const apiKey = process.env.GEMINI_API_KEY?.trim()
    if (!apiKey) throw new ConvexError({ code: 'GEMINI_NOT_CONFIGURED' })

    await ctx.runMutation(internal.analysis.setAnalysisState, { outfitId, status: 'analyzing' })
    try {
      const { imageUrl } = await ctx.runQuery(internal.analysis.getAnalysisInput, { outfitId })
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) throw new Error('Stored outfit image could not be read')
      const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg'
      const imageData = toBase64(await imageResponse.arrayBuffer())

      const model = process.env.GEMINI_VISION_MODEL || 'gemini-2.5-flash'
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: 'Identify only garments visibly worn by the person. Be conservative. Use "unknown" whenever a visual attribute is unclear. Do not infer mood, occasion, comfort, brand, price, fabric, identity, body type, or ownership. For each garment, return a tight boundingBox around only that garment using normalized image coordinates from 0 to 1: x from the left edge, y from the top edge, plus width and height. Keep every box fully inside the image.' },
            { inlineData: { mimeType, data: imageData } },
          ] }],
          generationConfig: { responseMimeType: 'application/json', responseSchema },
        }),
      })
      if (!response.ok) {
        const detail = (await response.text()).slice(0, 500)
        throw new Error(`Gemini request failed (${response.status}): ${detail}`)
      }

      const suggestions = parseGeminiGarments(await response.json())
      await ctx.runMutation(internal.analysis.saveSuggestions, { outfitId, suggestions })
      return { count: suggestions.length }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Image analysis failed'
      await ctx.runMutation(internal.analysis.setAnalysisState, { outfitId, status: 'failed', error: message.slice(0, 300) })
      throw new ConvexError({ code: 'IMAGE_ANALYSIS_FAILED', message })
    }
  },
})
