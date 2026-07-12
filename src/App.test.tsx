import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'

describe('wardrobe readiness shell', () => {
  it('shows how many outfits remain before styling unlocks', () => {
    render(<App initialOutfitCount={0} />)

    expect(screen.getByRole('heading', { name: /build a stylist that knows your wardrobe/i })).toBeInTheDocument()
    expect(screen.getByText(/add 3 outfits to unlock your first recommendations/i)).toBeInTheDocument()
    expect(screen.getByText('0 of 3')).toBeInTheDocument()
  })

  it('unlocks the styling request at three outfits', async () => {
    const user = userEvent.setup()
    render(<App initialOutfitCount={2} />)

    expect(screen.getByText(/one more outfit/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /add demo outfit/i }))

    expect(screen.getByText(/your personal stylist is ready/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ask for an outfit/i })).toBeEnabled()
  })

  it('shows the free wardrobe limit without removing recommendation access', () => {
    render(<App initialOutfitCount={10} />)

    expect(screen.getByText(/10-outfit free wardrobe is full/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ask for an outfit/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /unlock unlimited wardrobe/i })).toBeInTheDocument()
  })
})
