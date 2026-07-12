import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GarmentReview } from './GarmentReview'

const garment = {
  _id: 'garment-1',
  label: 'White shirt',
  category: 'top' as const,
  subtype: 'button-down shirt',
  primaryColor: 'white',
  pattern: 'solid',
  fit: 'relaxed',
  confidence: 0.92,
  confirmed: false,
}

describe('GarmentReview', () => {
  it('lets the user correct and confirm provisional garments', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn().mockResolvedValue(undefined)
    const onConfirm = vi.fn().mockResolvedValue(undefined)
    render(<GarmentReview outfitId="outfit-1" status="ready" garments={[garment]} onAnalyze={vi.fn()} onUpdate={onUpdate} onRemove={vi.fn()} onAdd={vi.fn()} onConfirm={onConfirm} />)

    await user.clear(screen.getByLabelText('Garment label'))
    await user.type(screen.getByLabelText('Garment label'), 'Cream shirt')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ garmentId: 'garment-1', label: 'Cream shirt' }))

    await user.click(screen.getByRole('button', { name: 'Confirm wardrobe items' }))
    expect(onConfirm).toHaveBeenCalledWith('outfit-1')
  })

  it('offers analysis retry after a failure', async () => {
    const user = userEvent.setup()
    const onAnalyze = vi.fn().mockResolvedValue(undefined)
    render(<GarmentReview outfitId="outfit-1" status="failed" error="Image analysis failed" garments={[]} onAnalyze={onAnalyze} onUpdate={vi.fn()} onRemove={vi.fn()} onAdd={vi.fn()} onConfirm={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Try analysis again' }))
    expect(onAnalyze).toHaveBeenCalledWith('outfit-1')
  })
})
