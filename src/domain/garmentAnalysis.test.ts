import { describe, expect, it } from 'vitest'
import { garmentAnalysisSchema } from './garmentAnalysis'

const validGarment = {
  label: 'White oversized shirt',
  category: 'top',
  subtype: 'button-down shirt',
  primaryColor: 'white',
  secondaryColors: [],
  pattern: 'solid',
  fit: 'oversized',
  silhouette: 'relaxed',
  layerPosition: 'base',
  confidence: 0.91,
}

describe('garmentAnalysisSchema', () => {
  it('accepts conservative structured garment suggestions', () => {
    expect(garmentAnalysisSchema.parse({ garments: [validGarment] })).toEqual({ garments: [validGarment] })
  })

  it('rejects unsupported categories and out-of-range confidence', () => {
    expect(() => garmentAnalysisSchema.parse({
      garments: [{ ...validGarment, category: 'designer-piece', confidence: 1.4 }],
    })).toThrow()
  })

  it('allows unknown visual attributes instead of requiring invention', () => {
    const result = garmentAnalysisSchema.parse({
      garments: [{
        ...validGarment,
        subtype: 'unknown',
        primaryColor: 'unknown',
        pattern: 'unknown',
        fit: 'unknown',
        silhouette: 'unknown',
        layerPosition: 'unknown',
      }],
    })
    expect(result.garments[0].fit).toBe('unknown')
  })
})
