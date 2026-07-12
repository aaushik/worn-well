export type CropBox = { x: number; y: number; width: number; height: number }

type Categorized = { category: string }

export function matchUnambiguousCropBoxes<TConfirmed extends Categorized, TSuggestion extends Categorized & { boundingBox: CropBox }>(
  confirmed: TConfirmed[],
  suggestions: TSuggestion[],
) {
  const categories = new Set([...confirmed, ...suggestions].map((item) => item.category))
  return [...categories].flatMap((category) => {
    const targets = confirmed.filter((item) => item.category === category)
    const sources = suggestions.filter((item) => item.category === category)
    return targets.length === 1 && sources.length === 1
      ? [{ garment: targets[0], boundingBox: sources[0].boundingBox }]
      : []
  })
}
