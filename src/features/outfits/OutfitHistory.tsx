import { GarmentRecord, GarmentReview, GarmentReviewProps } from '../garments/GarmentReview'

export type OutfitSummary = {
  _id: string
  imageUrl: string | null
  occasion?: string
  wornAt: string
  confidenceAfter?: number
  comfort?: number
  liked?: string
  evidenceLevel?: 'photo_only' | 'quick_context' | 'conversational'
  analysisStatus?: 'pending' | 'analyzing' | 'ready' | 'failed'
  analysisError?: string
  status: 'confirmed' | 'sample'
}

export type WardrobeGarment = GarmentRecord & { sourceOutfitId: string }

type ReviewActions = Omit<GarmentReviewProps, 'outfitId' | 'status' | 'error' | 'garments'>

type Props = ReviewActions & {
  outfits: OutfitSummary[]
  garments: WardrobeGarment[]
}

export function OutfitHistory({ outfits, garments, ...actions }: Props) {
  if (!outfits.length) {
    return <p className="empty-history">Your logged outfits will appear here.</p>
  }

  return (
    <section className="history" aria-labelledby="history-title">
      <div className="history-heading">
        <p className="section-label">OUTFIT HISTORY</p>
        <h2 id="history-title">Evidence your stylist can use.</h2>
      </div>
      <div className="outfit-grid">
        {outfits.map((outfit, index) => {
          const outfitGarments = garments.filter((garment) => garment.sourceOutfitId === outfit._id)
          return (
            <article className="outfit-card" key={outfit._id}>
              <div className="outfit-image">
                {outfit.imageUrl ? <img alt={`${outfit.occasion ?? 'Logged'} outfit`} src={outfit.imageUrl} /> : <span>No image</span>}
                <span className="outfit-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="sample-badge">{outfit.status === 'sample' ? 'SAMPLE' : (outfit.evidenceLevel ?? 'confirmed').replace('_', ' ')}</span>
              </div>
              <div className="outfit-details">
                <span>{outfit.wornAt}</span>
                <h3>{outfit.occasion ?? 'Photo-only outfit'}</h3>
                <p>{outfit.liked ?? 'Visible style details ready for image analysis.'}</p>
                {(outfit.confidenceAfter || outfit.comfort) && <div className="outfit-ratings">{outfit.confidenceAfter && <span>Confidence {outfit.confidenceAfter}/10</span>}{outfit.comfort && <span>Comfort {outfit.comfort}/10</span>}</div>}
                {outfit.status !== 'sample' && <GarmentReview outfitId={outfit._id} status={outfit.analysisStatus ?? 'pending'} error={outfit.analysisError} garments={outfitGarments} {...actions} />}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
