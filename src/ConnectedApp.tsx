import { useEffect } from 'react'
import { useAction, useMutation, useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import { Id } from '../convex/_generated/dataModel'
import { App } from './App'
import { CaptureValue } from './features/outfits/CaptureFlow'
import { GarmentInput } from './features/garments/GarmentReview'

export function ConnectedApp() {
  const outfits = useQuery(api.outfits.list) ?? []
  const garments = useQuery(api.garments.listForDemoUser) ?? []
  const ensureDemoUser = useMutation(api.users.ensureDemoUser)
  const generateUploadUrl = useMutation(api.outfits.generateUploadUrl)
  const createOutfit = useMutation(api.outfits.createCaptured)
  const analyzeOutfit = useAction(api.analysis.analyzeOutfit)
  const updateGarment = useMutation(api.garments.update)
  const removeGarment = useMutation(api.garments.remove)
  const addGarment = useMutation(api.garments.addManual)
  const confirmGarments = useMutation(api.garments.confirmForOutfit)

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
    const outfitId = await createOutfit({ ...input, wornAt: new Date().toISOString().slice(0, 10), imageStorageId: storageId })
    void analyzeOutfit({ outfitId }).catch(() => undefined)
  }

  function analyze(outfitId: string) {
    return analyzeOutfit({ outfitId: outfitId as Id<'outfits'> })
  }

  function update(input: GarmentInput & { garmentId: string }) {
    return updateGarment({ ...input, garmentId: input.garmentId as Id<'garments'> })
  }

  function remove(garmentId: string) {
    return removeGarment({ garmentId: garmentId as Id<'garments'> })
  }

  function add(input: GarmentInput & { outfitId: string }) {
    return addGarment({ ...input, outfitId: input.outfitId as Id<'outfits'> })
  }

  function confirm(outfitId: string) {
    return confirmGarments({ outfitId: outfitId as Id<'outfits'> })
  }

  return <App
    outfits={outfits.map((outfit) => ({ ...outfit, _id: String(outfit._id) }))}
    garments={garments.map((garment) => ({ ...garment, _id: String(garment._id), sourceOutfitId: String(garment.sourceOutfitId) }))}
    onSaveOutfit={saveOutfit}
    onAnalyzeGarments={analyze}
    onUpdateGarment={update}
    onRemoveGarment={remove}
    onAddGarment={add}
    onConfirmGarments={confirm}
  />
}
