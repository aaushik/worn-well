import { describe, expect, it } from 'vitest'
import { isCompleteLook, parseStylistRecommendation } from '../../convex/lib/stylist'

const response = (garmentIds: string[]) => ({
  candidates: [{ content: { parts: [{ text: JSON.stringify({ looks: [{ garmentIds }] }) }] } }],
})

describe('parseStylistRecommendation', () => {
  it('returns recommendations that cite only allowed confirmed garment ids', () => {
    const result = parseStylistRecommendation(response(['shirt-1', 'jeans-1']), new Set(['shirt-1', 'jeans-1']))
    expect(result.looks[0].garmentIds).toEqual(['shirt-1', 'jeans-1'])
  })

  it('rejects a recommendation containing an invented or unconfirmed garment id', () => {
    expect(() => parseStylistRecommendation(response(['shirt-1', 'invented-coat']), new Set(['shirt-1']))).toThrow('unconfirmed garment')
  })

  it('rejects duplicate garment ids within a look', () => {
    expect(() => parseStylistRecommendation(response(['shirt-1', 'shirt-1']), new Set(['shirt-1']))).toThrow()
  })

  it('rejects more than four garments in one look', () => {
    const ids = ['1', '2', '3', '4', '5']
    expect(() => parseStylistRecommendation(response(ids), new Set(ids))).toThrow()
  })

  it('requires either a dress or a top and bottom for a complete look', () => {
    expect(isCompleteLook([{ category: 'footwear' }])).toBe(false)
    expect(isCompleteLook([{ category: 'top' }, { category: 'bottom' }])).toBe(true)
    expect(isCompleteLook([{ category: 'dress' }])).toBe(true)
  })

  it('rejects empty looks', () => {
    const empty = { candidates: [{ content: { parts: [{ text: JSON.stringify({ looks: [] }) }] } }] }
    expect(() => parseStylistRecommendation(empty, new Set(['shirt-1']))).toThrow()
  })
})
