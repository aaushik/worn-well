import { z } from 'zod'

export const garmentCategories = [
  'top',
  'bottom',
  'dress',
  'outerwear',
  'footwear',
  'accessory',
  'unknown',
] as const

const visualValue = z.string().trim().min(1).max(80)

export const garmentSuggestionSchema = z.object({
  label: z.string().trim().min(1).max(120),
  category: z.enum(garmentCategories),
  subtype: visualValue,
  primaryColor: visualValue,
  secondaryColors: z.array(visualValue).max(4),
  pattern: visualValue,
  fit: visualValue,
  silhouette: visualValue,
  layerPosition: visualValue,
  confidence: z.number().min(0).max(1),
})

export const garmentAnalysisSchema = z.object({
  garments: z.array(garmentSuggestionSchema).max(20),
})

export type GarmentSuggestion = z.infer<typeof garmentSuggestionSchema>
export type GarmentAnalysis = z.infer<typeof garmentAnalysisSchema>
