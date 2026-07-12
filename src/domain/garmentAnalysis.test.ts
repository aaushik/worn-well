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
  boundingBox: { x: 0.1, y: 0.15, width: 0.5, height: 0.4 },
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

  it('rejects crop boxes outside the normalized image bounds', () => {
    expect(() => garmentAnalysisSchema.parse({
      garments: [{ ...validGarment, boundingBox: { x: 0.8, y: 0.1, width: 0.4, height: 0.4 } }],
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
