import { z } from 'zod'

export const stylistRecommendationSchema = z.object({
  looks: z.array(z.object({
    title: z.string().trim().min(1).max(80),
    garmentIds: z.array(z.string().trim().min(1)).min(1),
    reason: z.string().trim().min(1).max(500),
    stylingNotes: z.array(z.string().trim().min(1).max(200)).max(4),
  })).min(1).max(3),
})

export const stylistSelectionSchema = z.object({
  looks: z.array(z.object({
    garmentIds: z.array(z.string().trim().min(1)).min(1).max(4).refine((ids) => new Set(ids).size === ids.length, 'Garment IDs must be unique'),
  }).strict()).min(1).max(3),
}).strict()

export type StylistRecommendation = z.infer<typeof stylistRecommendationSchema>
export type StylistSelection = z.infer<typeof stylistSelectionSchema>
