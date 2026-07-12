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
const boundingBoxSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().positive().max(1),
  height: z.number().positive().max(1),
}).refine((box) => box.x + box.width <= 1 && box.y + box.height <= 1, 'Bounding box must stay within the image')

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
  boundingBox: boundingBoxSchema,
})

export const garmentAnalysisSchema = z.object({
  garments: z.array(garmentSuggestionSchema).max(20),
})

export type GarmentSuggestion = z.infer<typeof garmentSuggestionSchema>
export type GarmentAnalysis = z.infer<typeof garmentAnalysisSchema>
