import { useMemo, useState } from 'react'
import { FREE_OUTFIT_LIMIT, STYLIST_UNLOCK_COUNT } from './domain/wardrobe'
import { CaptureFlow, CaptureValue } from './features/outfits/CaptureFlow'
import { OutfitHistory, OutfitSummary } from './features/outfits/OutfitHistory'
import './styles.css'

type AppProps = {
  initialOutfitCount?: number
  outfits?: OutfitSummary[]
  onSaveOutfit?: (value: CaptureValue) => Promise<void>
}

function readinessCopy(count: number) {
  if (count >= FREE_OUTFIT_LIMIT) return 'Your 10-outfit free wardrobe is full.'
  if (count >= STYLIST_UNLOCK_COUNT) return 'Your personal stylist is ready.'
  if (count === STYLIST_UNLOCK_COUNT - 1) return 'One more outfit to unlock your personal stylist.'
  return `Add ${STYLIST_UNLOCK_COUNT - count} outfits to unlock your first recommendations.`
}

export function App({ initialOutfitCount = 0, outfits = [], onSaveOutfit }: AppProps) {
  const [demoCount, setDemoCount] = useState(initialOutfitCount)
  const [formOpen, setFormOpen] = useState(false)
  const outfitCount = onSaveOutfit ? outfits.length : demoCount
  const isStylistReady = outfitCount >= STYLIST_UNLOCK_COUNT
  const isFreeWardrobeFull = outfitCount >= FREE_OUTFIT_LIMIT
  const unlockProgress = Math.min(outfitCount, STYLIST_UNLOCK_COUNT)
  const progress = `${(unlockProgress / STYLIST_UNLOCK_COUNT) * 100}%`
  const milestones = useMemo(() => Array.from({ length: STYLIST_UNLOCK_COUNT }), [])

  function beginOutfit() {
    if (onSaveOutfit) setFormOpen(true)
    else if (!isFreeWardrobeFull) setDemoCount((current) => current + 1)
  }

  async function saveOutfit(value: CaptureValue) {
    if (!onSaveOutfit) return
    await onSaveOutfit(value)
    setFormOpen(false)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="Worn Well home"><span className="wordmark-mark">W</span><span>Worn Well</span></a>
        <span className="plan-label">Free wardrobe · {outfitCount}/{FREE_OUTFIT_LIMIT}</span>
      </header>

      <section className="workspace" id="top">
        <div className="intro">
          <p className="eyebrow">YOUR STYLE PROFILE</p>
          <h1>Build a stylist that knows your wardrobe.</h1>
          <p className="lede">Log what you actually wore and how it felt. Your recommendations will be grounded in your clothes—not an imaginary closet.</p>
        </div>

        <section className="readiness-panel" aria-labelledby="readiness-title">
          <div className="readiness-heading"><div><p className="section-label">WARDROBE READINESS</p><h2 id="readiness-title">{readinessCopy(outfitCount)}</h2></div><span className="readiness-count">{unlockProgress} of {STYLIST_UNLOCK_COUNT}</span></div>
          <div className="progress-track" aria-label={`${unlockProgress} of ${STYLIST_UNLOCK_COUNT} outfits added`}><span style={{ width: progress }} /></div>
          <ol className="milestones" aria-label="Outfit milestones">
            {milestones.map((_, index) => <li className={outfitCount > index ? 'complete' : ''} key={index}><span>{outfitCount > index ? '✓' : index + 1}</span><small>{index === 3 ? 'Stylist unlocks' : `Outfit ${index + 1}`}</small></li>)}
          </ol>
          <div className="actions">
            {!isFreeWardrobeFull && <button className="primary-action" type="button" onClick={beginOutfit}><span>{onSaveOutfit ? 'Log an outfit' : 'Add demo outfit'}</span><span aria-hidden="true">↗</span></button>}
            <button className="secondary-action" type="button" disabled={!isStylistReady}>Ask for an outfit</button>
            {isFreeWardrobeFull && <button className="upgrade-action" type="button">Unlock unlimited wardrobe</button>}
          </div>
        </section>

        {formOpen && <div className="capture-overlay"><CaptureFlow onClose={() => setFormOpen(false)} onSave={saveOutfit} /></div>}
        {onSaveOutfit && <OutfitHistory outfits={outfits} />}

        <aside className="principle" aria-label="Product principle"><span className="principle-number">01</span><p><strong>No invented clothes.</strong>Every recommendation must point back to a garment you confirmed.</p></aside>
      </section>
    </main>
  )
}
