import { FormEvent, useState } from 'react'
import { garmentCategories } from '../../domain/garmentAnalysis'

type Category = typeof garmentCategories[number]

export type GarmentRecord = {
  _id: string
  label: string
  category: Category
  subtype?: string
  primaryColor?: string
  pattern?: string
  fit?: string
  confidence?: number
  confirmed: boolean
}

export type GarmentInput = {
  label: string
  category: Category
  subtype: string
  primaryColor: string
  pattern: string
  fit: string
}

export type GarmentReviewProps = {
  outfitId: string
  status?: 'pending' | 'analyzing' | 'ready' | 'failed'
  error?: string
  garments: GarmentRecord[]
  onAnalyze: (outfitId: string) => Promise<unknown>
  onUpdate: (input: GarmentInput & { garmentId: string }) => Promise<unknown>
  onRemove: (garmentId: string) => Promise<unknown>
  onAdd: (input: GarmentInput & { outfitId: string }) => Promise<unknown>
  onConfirm: (outfitId: string) => Promise<unknown>
}

const emptyGarment: GarmentInput = {
  label: '',
  category: 'unknown',
  subtype: 'unknown',
  primaryColor: 'unknown',
  pattern: 'unknown',
  fit: 'unknown',
}

function GarmentFields({ value, onChange }: { value: GarmentInput; onChange: (value: GarmentInput) => void }) {
  const set = (field: keyof GarmentInput, next: string) => onChange({ ...value, [field]: next })
  return (
    <div className="garment-fields">
      <label>Garment label<input aria-label="Garment label" value={value.label} onChange={(event) => set('label', event.target.value)} /></label>
      <label>Category<select aria-label="Garment category" value={value.category} onChange={(event) => set('category', event.target.value)}>{garmentCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
      <label>Type<input aria-label="Garment type" value={value.subtype} onChange={(event) => set('subtype', event.target.value)} /></label>
      <label>Primary color<input aria-label="Primary color" value={value.primaryColor} onChange={(event) => set('primaryColor', event.target.value)} /></label>
      <label>Pattern<input aria-label="Pattern" value={value.pattern} onChange={(event) => set('pattern', event.target.value)} /></label>
      <label>Fit<input aria-label="Fit" value={value.fit} onChange={(event) => set('fit', event.target.value)} /></label>
    </div>
  )
}

function EditableGarment({ garment, onUpdate, onRemove }: Pick<GarmentReviewProps, 'onUpdate' | 'onRemove'> & { garment: GarmentRecord }) {
  const [value, setValue] = useState<GarmentInput>({
    label: garment.label,
    category: garment.category,
    subtype: garment.subtype ?? 'unknown',
    primaryColor: garment.primaryColor ?? 'unknown',
    pattern: garment.pattern ?? 'unknown',
    fit: garment.fit ?? 'unknown',
  })
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try { await onUpdate({ garmentId: garment._id, ...value }) } finally { setSaving(false) }
  }

  return (
    <form className="garment-card" onSubmit={submit}>
      <div className="garment-card-heading">
        <span>{garment.confirmed ? 'CONFIRMED' : 'PROVISIONAL'}</span>
        {garment.confidence !== undefined && <span>{Math.round(garment.confidence * 100)}% visual confidence</span>}
      </div>
      <GarmentFields value={value} onChange={setValue} />
      {!garment.confirmed && <div className="garment-actions"><button disabled={saving} type="submit">{saving ? 'Saving…' : 'Save changes'}</button><button className="text-button" type="button" onClick={() => void onRemove(garment._id)}>Remove</button></div>}
    </form>
  )
}

export function GarmentReview({ outfitId, status, error, garments, onAnalyze, onUpdate, onRemove, onAdd, onConfirm }: GarmentReviewProps) {
  const [adding, setAdding] = useState(false)
  const [manual, setManual] = useState(emptyGarment)
  const [busy, setBusy] = useState(false)
  const allConfirmed = garments.length > 0 && garments.every((garment) => garment.confirmed)

  async function addManual(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    try {
      await onAdd({ outfitId, ...manual })
      setManual(emptyGarment)
      setAdding(false)
    } finally { setBusy(false) }
  }

  async function run(task: () => Promise<unknown>) {
    setBusy(true)
    try { await task() } finally { setBusy(false) }
  }

  return (
    <section className="garment-review" aria-label="Garment review">
      {status === 'pending' && <button disabled={busy} onClick={() => void run(() => onAnalyze(outfitId))}>Analyze garments</button>}
      {status === 'analyzing' && <p role="status">Analyzing visible garments…</p>}
      {status === 'failed' && <div className="analysis-error"><p>{error ?? 'Image analysis failed. You can retry or add garments manually.'}</p><button disabled={busy} onClick={() => void run(() => onAnalyze(outfitId))}>Try analysis again</button></div>}

      {garments.map((garment) => <EditableGarment garment={garment} key={garment._id} onUpdate={onUpdate} onRemove={onRemove} />)}

      {!allConfirmed && <div className="review-actions">
        <button className="text-button" type="button" onClick={() => setAdding((value) => !value)}>{adding ? 'Cancel manual entry' : 'Add missed garment'}</button>
        {garments.length > 0 && <button disabled={busy} type="button" onClick={() => void run(() => onConfirm(outfitId))}>Confirm wardrobe items</button>}
      </div>}

      {adding && <form className="manual-garment" onSubmit={addManual}><GarmentFields value={manual} onChange={setManual} /><button disabled={busy || !manual.label.trim()} type="submit">Add garment</button></form>}
    </section>
  )
}
