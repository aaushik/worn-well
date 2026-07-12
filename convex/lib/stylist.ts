import { stylistSelectionSchema, type StylistSelection } from '../../src/domain/stylistRecommendation'

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
}

type GarmentCategory = 'top' | 'bottom' | 'dress' | 'outerwear' | 'footwear' | 'accessory' | 'unknown'

export function isCompleteLook(garments: Array<{ category: GarmentCategory }>) {
  const categories = new Set(garments.map((garment) => garment.category))
  return categories.has('dress') || (categories.has('top') && categories.has('bottom'))
}

export function parseStylistRecommendation(response: unknown, allowedGarmentIds: Set<string>): StylistSelection {
  const data = response as GeminiResponse
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim()
  if (!text) throw new Error('Gemini returned no outfit recommendation')

  const recommendation = stylistSelectionSchema.parse(JSON.parse(text))
  for (const look of recommendation.looks) {
    if (look.garmentIds.some((id) => !allowedGarmentIds.has(id))) {
      throw new Error('Recommendation referenced an invented or unconfirmed garment')
    }
  }
  return recommendation
}
