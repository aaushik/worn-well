import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StylistPanel } from './StylistPanel'

const recommendation = {
  looks: [{
    title: 'Easy dinner look',
    garmentIds: ['shirt-1', 'jeans-1'],
    reason: 'The confirmed pieces create relaxed contrast.',
    stylingNotes: ['Wear the shirt untucked.'],
  }],
  garments: [
    { id: 'shirt-1', label: 'White shirt', category: 'top' as const, subtype: 'button-up', primaryColor: 'white', secondaryColors: [], pattern: 'solid', fit: 'relaxed', silhouette: 'straight', sourceImageUrl: 'https://example.com/outfit.jpg', boundingBox: { x: 0.1, y: 0.1, width: 0.4, height: 0.5 } },
    { id: 'jeans-1', label: 'Dark jeans', category: 'bottom' as const, subtype: 'jeans', primaryColor: 'blue', secondaryColors: [], pattern: 'solid', fit: 'regular', silhouette: 'straight' },
  ],
  provisionalGarmentCount: 0,
}

describe('StylistPanel', () => {
  it('blocks recommendations until provisional garment detections are reviewed', async () => {
    render(<StylistPanel onClose={vi.fn()} onRecommend={vi.fn()} provisionalGarmentCount={5} />)

    expect(screen.getByText(/review and confirm 5 extracted items/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirm garments first/i })).toBeDisabled()
  })

  it('requests and renders recommendations using confirmed wardrobe labels', async () => {
    const user = userEvent.setup()
    const onRecommend = vi.fn().mockResolvedValue(recommendation)
    render(<StylistPanel onClose={vi.fn()} onRecommend={onRecommend} />)

    await user.type(screen.getByLabelText(/where are you going/i), 'Casual dinner')
    await user.type(screen.getByLabelText(/weather/i), 'Warm evening')
    await user.click(screen.getByRole('button', { name: /build my outfit/i }))

    expect(onRecommend).toHaveBeenCalledWith({ occasion: 'Casual dinner', weather: 'Warm evening', preference: undefined })
    expect(await screen.findByText('Easy dinner look')).toBeInTheDocument()
    expect(screen.getByText('White shirt')).toBeInTheDocument()
    expect(screen.getByText('Dark jeans')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /white shirt crop/i })).toHaveAttribute('src', 'https://example.com/outfit.jpg')
  })

  it('removes a previous result while submitting a new request', async () => {
    const user = userEvent.setup()
    const onRecommend = vi.fn()
      .mockResolvedValueOnce(recommendation)
      .mockImplementationOnce(() => new Promise(() => undefined))
    render(<StylistPanel onClose={vi.fn()} onRecommend={onRecommend} />)

    await user.type(screen.getByLabelText(/where are you going/i), 'Dinner')
    await user.click(screen.getByRole('button', { name: /build my outfit/i }))
    expect(await screen.findByText('Easy dinner look')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /build my outfit/i }))
    expect(screen.queryByText('Easy dinner look')).not.toBeInTheDocument()
  })
})
