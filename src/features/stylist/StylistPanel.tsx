import { FormEvent, useState } from 'react'
import type { CSSProperties, SyntheticEvent } from 'react'
import type { StylistRecommendation } from '../../domain/stylistRecommendation'

export type GroundedGarment = {
  id: string
  label: string
  category: 'top' | 'bottom' | 'dress' | 'outerwear' | 'footwear' | 'accessory' | 'unknown'
  subtype: string
  primaryColor: string
  secondaryColors: string[]
  pattern: string
  fit: string
  silhouette: string
  sourceImageUrl?: string | null
  boundingBox?: { x: number; y: number; width: number; height: number }
}

export type StylistResult = StylistRecommendation & {
  garments: GroundedGarment[]
  provisionalGarmentCount: number
}

export type StylistRequest = {
  occasion: string
  weather?: string
  preference?: string
}

type Props = {
  onClose: () => void
  onRecommend: (request: StylistRequest) => Promise<StylistResult>
  provisionalGarmentCount?: number
}

function GarmentCrop({ garment }: { garment: GroundedGarment }) {
  const [sourceRatio, setSourceRatio] = useState(1)
  if (!garment.sourceImageUrl || !garment.boundingBox) return null
  const box = garment.boundingBox
  const frameStyle = { aspectRatio: String((box.width * sourceRatio) / box.height) } as CSSProperties
  const imageStyle = {
    width: `${100 / box.width}%`,
    height: `${100 / box.height}%`,
    left: `${-(box.x / box.width) * 100}%`,
    top: `${-(box.y / box.height) * 100}%`,
  } as CSSProperties
  function loaded(event: SyntheticEvent<HTMLImageElement>) {
    const image = event.currentTarget
    setSourceRatio(image.naturalWidth / image.naturalHeight)
  }
  return <div className="garment-crop" style={frameStyle}>
    <img src={garment.sourceImageUrl} alt={`${garment.label} crop`} style={imageStyle} onLoad={loaded} />
  </div>
}

export function StylistPanel({ onClose, onRecommend, provisionalGarmentCount = 0 }: Props) {
  const [occasion, setOccasion] = useState('')
  const [weather, setWeather] = useState('')
  const [preference, setPreference] = useState('')
  const [result, setResult] = useState<StylistResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!occasion.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      setResult(await onRecommend({
        occasion: occasion.trim(),
        weather: weather.trim() || undefined,
        preference: preference.trim() || undefined,
      }))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The stylist could not build a recommendation.')
    } finally {
      setLoading(false)
    }
  }

  const garmentById = new Map(result?.garments.map((garment) => [garment.id, garment]))

  return (
    <section className="stylist-sheet" aria-labelledby="stylist-title">
      <button className="sheet-close" onClick={onClose} type="button" aria-label="Close stylist">×</button>
      <p className="section-label">YOUR WARDROBE STYLIST</p>
      <h2 id="stylist-title">What are you dressing for?</h2>
      <p className="capture-copy">Recommendations use confirmed wardrobe items only.</p>

      {provisionalGarmentCount > 0 && <p className="provisional-warning">Review and confirm {provisionalGarmentCount} extracted items in Outfit History first. Then the stylist can use all three outfits.</p>}

      <form className="stylist-request" onSubmit={submit}>
        <label>Where are you going?<input required value={occasion} onChange={(event) => setOccasion(event.target.value)} placeholder="Casual dinner, work, a date…" /></label>
        <label>Weather or temperature <input value={weather} onChange={(event) => setWeather(event.target.value)} placeholder="Warm evening, cool and rainy…" /></label>
        <label>Anything you want today? <input value={preference} onChange={(event) => setPreference(event.target.value)} placeholder="Relaxed, polished, experimental…" /></label>
        <button className="mobile-primary" disabled={loading || !occasion.trim() || provisionalGarmentCount > 0} type="submit">{loading ? 'Building from your wardrobe…' : provisionalGarmentCount > 0 ? 'Confirm garments first' : 'Build my outfit'}</button>
      </form>

      {error && <p className="inline-error" role="alert">{error}</p>}

      {result && <div className="stylist-results" aria-live="polite">
        {result.looks.map((look, index) => <article className="look-card" key={`${look.title}-${index}`}>
          <p className="section-label">LOOK {String(index + 1).padStart(2, '0')}</p>
          <h3>{look.title}</h3>
          <ul className="look-garments">{look.garmentIds.map((id) => {
            const garment = garmentById.get(id)
            return garment ? <li key={id}>
              <GarmentCrop garment={garment} />
              <strong>{garment.label}</strong><span>{garment.primaryColor} · {garment.subtype}</span>
            </li> : null
          })}</ul>
          <p>{look.reason}</p>
          {look.stylingNotes.length > 0 && <ul className="styling-notes">{look.stylingNotes.map((note) => <li key={note}>{note}</li>)}</ul>}
        </article>)}
      </div>}
    </section>
  )
}
