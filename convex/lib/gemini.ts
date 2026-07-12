import { garmentAnalysisSchema, type GarmentSuggestion } from '../../src/domain/garmentAnalysis'

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
}

const categoryKeywords = {
  top: ['top', 'shirt', 't-shirt', 'tee', 'blouse', 'sweater', 'hoodie', 'tank', 'polo'],
  bottom: ['bottom', 'pants', 'trousers', 'jeans', 'shorts', 'skirt', 'leggings'],
  dress: ['dress', 'gown', 'jumpsuit', 'romper'],
  outerwear: ['outerwear', 'jacket', 'coat', 'blazer', 'cardigan', 'vest'],
  footwear: ['footwear', 'shoe', 'shoes', 'sneaker', 'sneakers', 'boot', 'boots', 'sandal', 'sandals', 'heel', 'heels'],
  accessory: ['accessory', 'jewelry', 'jewellery', 'necklace', 'bracelet', 'earring', 'hat', 'cap', 'bag', 'belt', 'scarf', 'tie'],
} as const

type NormalizedCategory = keyof typeof categoryKeywords | 'unknown'

function normalizeCategory(garment: Record<string, unknown>): NormalizedCategory {
  const evidence = [garment.category, garment.subtype, garment.label]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase()

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((keyword) => new RegExp(`\\b${keyword.replace('-', '[ -]?')}s?\\b`, 'i').test(evidence))) {
      return category as NormalizedCategory
    }
  }
  return 'unknown'
}

export function parseGeminiGarments(response: unknown): GarmentSuggestion[] {
  const data = response as GeminiResponse
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim()
  if (!text) throw new Error('Gemini returned no garment analysis')

  const raw = JSON.parse(text) as { garments?: unknown[] }
  const normalized = {
    ...raw,
    garments: Array.isArray(raw.garments)
      ? raw.garments.map((value) => {
          if (!value || typeof value !== 'object') return value
          const garment = value as Record<string, unknown>
          return { ...garment, category: normalizeCategory(garment) }
        })
      : raw.garments,
  }
  return garmentAnalysisSchema.parse(normalized).garments
}
