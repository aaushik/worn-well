import { describe, expect, it } from 'vitest'
import { matchUnambiguousCropBoxes } from '../../convex/lib/garmentCrops'

const box = { x: 0.1, y: 0.2, width: 0.3, height: 0.4 }

describe('matchUnambiguousCropBoxes', () => {
  it('matches categories represented exactly once on both sides', () => {
    expect(matchUnambiguousCropBoxes(
      [{ id: 'top', category: 'top' }, { id: 'bottom', category: 'bottom' }],
      [{ category: 'bottom', boundingBox: box }, { category: 'top', boundingBox: box }],
    ).map(({ garment }) => garment.id)).toEqual(['top', 'bottom'])
  })

  it('does not assign ambiguous same-category crops', () => {
    expect(matchUnambiguousCropBoxes(
      [{ id: 'shirt', category: 'top' }, { id: 'jacket', category: 'top' }],
      [{ category: 'top', boundingBox: box }, { category: 'top', boundingBox: box }],
    )).toEqual([])
  })

  it('does not assign a category-mismatched crop', () => {
    expect(matchUnambiguousCropBoxes(
      [{ id: 'shirt', category: 'top' }],
      [{ category: 'outerwear', boundingBox: box }],
    )).toEqual([])
  })
})
