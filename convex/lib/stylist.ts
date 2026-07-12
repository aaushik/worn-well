import { stylistSelectionSchema, type StylistSelection } from '../../src/domain/stylistRecommendation'

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
}

type GarmentCategory = 'top' | 'bottom' | 'dress' | 'outerwear' | 'footwear' | 'accessory' | 'unknown'

export function isCompleteLook(garments: Array<{ category: GarmentCategory }>) {
  const categories = new Set(garments.map((garment) => garment.category))
  return categories.has('dress') || (categories.has('top') && categories.has('bottom'))
}

export function buildFallbackSelection(garments: Array<{ id: string; category: GarmentCategory }>): StylistSelection {
  const byCategory = (category: GarmentCategory) => garments.filter((garment) => garment.category === category)
  const tops = byCategory('top')
  const bottoms = byCategory('bottom')
  const dresses = byCategory('dress')
  const footwear = byCategory('footwear')[0]
  const outerwear = byCategory('outerwear')[0]
  const looks: StylistSelection['looks'] = []
  for (let index = 0; index < Math.min(3, Math.max(tops.length, bottoms.length)); index += 1) {
    const top = tops[index % tops.length]
    const bottom = bottoms[index % bottoms.length]
    if (!top || !bottom) break
    looks.push({ garmentIds: [top.id, bottom.id, footwear?.id, outerwear?.id].filter((id): id is string => Boolean(id)).slice(0, 4) })
  }
  for (const dress of dresses) {
    if (looks.length >= 3) break
    looks.push({ garmentIds: [dress.id, footwear?.id, outerwear?.id].filter((id): id is string => Boolean(id)) })
  }
  if (looks.length === 0) throw new Error('No complete confirmed outfit is available')
  return { looks }
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
