import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CaptureFlow } from './CaptureFlow'

describe('CaptureFlow', () => {
  it('offers separate camera and photo-library inputs', () => {
    render(<CaptureFlow onClose={vi.fn()} onSave={vi.fn()} />)

    const cameraInput = screen.getByLabelText(/take a photo/i)
    const galleryInput = screen.getByLabelText(/choose from gallery/i)
    expect(cameraInput).toHaveAttribute('capture', 'environment')
    expect(galleryInput).not.toHaveAttribute('capture')
    expect(galleryInput).toHaveAttribute('accept', 'image/*')
  })

  it('quick-saves a camera image without forcing questions', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<CaptureFlow onClose={vi.fn()} onSave={onSave} />)

    const image = new File(['photo'], 'outfit.jpg', { type: 'image/jpeg' })
    await user.upload(screen.getByLabelText(/choose from gallery/i), image)
    await user.click(screen.getByRole('button', { name: /save quickly/i }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ image, evidenceLevel: 'photo_only' }))
  })

  it('advances the guided interview and keeps a visible transcript', async () => {
    const user = userEvent.setup()
    render(<CaptureFlow onClose={vi.fn()} onSave={vi.fn()} />)
    await user.upload(screen.getByLabelText(/choose from gallery/i), new File(['photo'], 'outfit.jpg', { type: 'image/jpeg' }))
    await user.click(screen.getByRole('button', { name: /talk through it/i }))
    await user.type(screen.getByLabelText(/type your answer/i), 'Coffee date')
    await user.click(screen.getByRole('button', { name: /use this answer/i }))

    expect(screen.getByText('Coffee date')).toBeInTheDocument()
    expect(screen.getByText(/how are you feeling/i)).toBeInTheDocument()
  })

  it('offers quick context and a guided conversation after capture', async () => {
    const user = userEvent.setup()
    render(<CaptureFlow onClose={vi.fn()} onSave={vi.fn()} />)

    await user.upload(screen.getByLabelText(/choose from gallery/i), new File(['photo'], 'outfit.jpg', { type: 'image/jpeg' }))
    expect(screen.getByRole('button', { name: /add quick context/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /talk through it/i }))
    expect(screen.getByText(/where are you going/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start listening/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/type your answer/i)).toBeInTheDocument()
  })
})
