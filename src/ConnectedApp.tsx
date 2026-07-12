import { useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import { App } from './App'
import { CaptureValue } from './features/outfits/CaptureFlow'

export function ConnectedApp() {
  const outfits = useQuery(api.outfits.list) ?? []
  const ensureDemoUser = useMutation(api.users.ensureDemoUser)
  const generateUploadUrl = useMutation(api.outfits.generateUploadUrl)
  const createOutfit = useMutation(api.outfits.createCaptured)

  useEffect(() => { void ensureDemoUser() }, [ensureDemoUser])

  async function saveOutfit({ image, ...input }: CaptureValue) {
    const uploadUrl = await generateUploadUrl()
    const upload = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': image.type },
      body: image,
    })
    if (!upload.ok) throw new Error('Image upload failed. Please try again.')
    const { storageId } = await upload.json()
    await createOutfit({ ...input, wornAt: new Date().toISOString().slice(0, 10), imageStorageId: storageId })
  }

  return <App outfits={outfits.map((outfit) => ({ ...outfit, _id: String(outfit._id) }))} onSaveOutfit={saveOutfit} />
}
