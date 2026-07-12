import { describe, expect, it } from 'vitest'
import { parseGeminiGarments } from '../../convex/lib/gemini'

const candidate = {
  label: 'Indigo denim jacket',
  category: 'outerwear',
  subtype: 'denim jacket',
  primaryColor: 'indigo',
  secondaryColors: [],
  pattern: 'solid',
  fit: 'relaxed',
  silhouette: 'boxy',
  layerPosition: 'outer',
  confidence: 0.88,
  boundingBox: { x: 0.1, y: 0.1, width: 0.5, height: 0.5 },
}

describe('parseGeminiGarments', () => {
  it('extracts and validates JSON from a Gemini response', () => {
    const response = {
      candidates: [{ content: { parts: [{ text: JSON.stringify({ garments: [candidate] }) }] } }],
    }
    expect(parseGeminiGarments(response)).toEqual([candidate])
  })

  it('rejects missing model output', () => {
    expect(() => parseGeminiGarments({ candidates: [] })).toThrow('Gemini returned no garment analysis')
  })

  it('normalizes descriptive provider categories into the wardrobe vocabulary', () => {
    const response = {
      candidates: [{ content: { parts: [{ text: JSON.stringify({ garments: [
        { ...candidate, category: 'clothing', subtype: 'blouse' },
        { ...candidate, label: 'Pendant necklace', category: 'jewelry', subtype: 'necklace' },
      ] }) }] } }],
    }

    expect(parseGeminiGarments(response).map((garment) => garment.category)).toEqual(['top', 'accessory'])
  })

  it('uses unknown when no category can be supported', () => {
    const response = {
      candidates: [{ content: { parts: [{ text: JSON.stringify({ garments: [{ ...candidate, label: 'Visible item', category: 'luxury', subtype: 'unknown' }] }) }] } }],
    }
    expect(parseGeminiGarments(response)[0].category).toBe('unknown')
  })
})
