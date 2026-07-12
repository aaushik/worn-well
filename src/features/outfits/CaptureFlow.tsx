import { FormEvent, useEffect, useState } from 'react'
import { applyInterviewAnswer, createInterview, nextInterviewPrompt, StyleInterview } from '../../domain/styleInterview'

export type CaptureValue = {
  image: File
  evidenceLevel: 'photo_only' | 'quick_context' | 'conversational'
  occasion?: string
  moodBefore?: string
  liked?: string
  disliked?: string
  comfort?: number
  confidenceAfter?: number
}

type Props = {
  onClose: () => void
  onSave: (value: CaptureValue) => Promise<void>
}

type SpeechRecognitionEventLike = { results: ArrayLike<{ 0: { transcript: string } }> }
type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

const occasions = ['Work', 'Casual', 'Date', 'Event', 'Travel']
const feelings = ['Confident', 'Comfortable', 'Experimental', 'Not quite right']

export function CaptureFlow({ onClose, onSave }: Props) {
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [mode, setMode] = useState<'choose' | 'quick' | 'talk'>('choose')
  const [occasion, setOccasion] = useState('')
  const [feeling, setFeeling] = useState('')
  const [interview, setInterview] = useState<StyleInterview>(createInterview)
  const [turns, setTurns] = useState<Array<{ prompt: string; answer: string }>>([])
  const [answer, setAnswer] = useState('')
  const [listening, setListening] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  function chooseImage(file: File | null) {
    if (!file) return
    if (preview) URL.revokeObjectURL(preview)
    setImage(file)
    if (typeof URL.createObjectURL === 'function') setPreview(URL.createObjectURL(file))
  }

  async function save(value: CaptureValue) {
    setSaving(true)
    setError('')
    try {
      await onSave(value)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save this outfit')
      setSaving(false)
    }
  }

  function listen() {
    const browser = window as typeof window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }
    const Recognition = browser.SpeechRecognition ?? browser.webkitSpeechRecognition
    if (!Recognition) {
      setError('Voice capture is not available in this browser. Type your answer below.')
      return
    }
    const recognition = new Recognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? ''
      setAnswer(transcript)
      setListening(false)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => {
      setListening(false)
      setError('I could not hear that. Try again or type your answer.')
    }
    setListening(true)
    recognition.start()
  }

  function submitAnswer(event: FormEvent) {
    event.preventDefault()
    if (!answer.trim()) return
    const currentPrompt = nextInterviewPrompt(interview)
    const updated = applyInterviewAnswer(interview, answer)
    setTurns((current) => [...current, { prompt: currentPrompt, answer: answer.trim() }])
    setInterview(updated)
    setAnswer('')
    const response = nextInterviewPrompt(updated)
    if ('speechSynthesis' in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(response))
  }

  if (!image) {
    return (
      <section className="capture-sheet" aria-labelledby="capture-title">
        <button className="sheet-close" onClick={onClose} type="button" aria-label="Close">×</button>
        <p className="section-label">OUTFIT 01</p>
        <h2 id="capture-title">Show me what you’re wearing.</h2>
        <p className="capture-copy">Take a photo now or choose one from your library.</p>
        <div className="capture-sources">
          <label className="camera-action">
            <span className="camera-icon" aria-hidden="true">◎</span>
            <strong>Take a photo</strong>
            <small>Open your camera</small>
            <input accept="image/*" capture="environment" type="file" onChange={(event) => chooseImage(event.target.files?.[0] ?? null)} />
          </label>
          <label className="gallery-action">
            <span className="gallery-icon" aria-hidden="true">▧</span>
            <strong>Choose from gallery</strong>
            <small>Browse your photo library</small>
            <input accept="image/*" type="file" onChange={(event) => chooseImage(event.target.files?.[0] ?? null)} />
          </label>
        </div>
      </section>
    )
  }

  if (mode === 'quick') {
    return (
      <section className="capture-sheet" aria-labelledby="quick-title">
        <button className="sheet-close" onClick={onClose} type="button" aria-label="Close">×</button>
        <p className="section-label">A LITTLE CONTEXT</p>
        <h2 id="quick-title">Two taps make this more useful.</h2>
        <fieldset><legend>Where are you going?</legend><div className="chip-list">{occasions.map((item) => <button className={occasion === item ? 'selected' : ''} key={item} onClick={() => setOccasion(item)} type="button">{item}</button>)}</div></fieldset>
        <fieldset><legend>How does it feel?</legend><div className="chip-list">{feelings.map((item) => <button className={feeling === item ? 'selected' : ''} key={item} onClick={() => setFeeling(item)} type="button">{item}</button>)}</div></fieldset>
        <button className="mobile-primary" disabled={saving} onClick={() => save({ image, evidenceLevel: 'quick_context', occasion: occasion || undefined, moodBefore: feeling || undefined })} type="button">{saving ? 'Saving…' : 'Save outfit'}</button>
      </section>
    )
  }

  if (mode === 'talk') {
    const prompt = nextInterviewPrompt(interview)
    return (
      <section className="capture-sheet interview-sheet" aria-labelledby="interview-title">
        <button className="sheet-close" onClick={onClose} type="button" aria-label="Close">×</button>
        <div className="voice-orb" aria-hidden="true"><span /></div>
        <p className="section-label">YOUR STYLE INTERVIEW</p>
        <h2 id="interview-title">{prompt}</h2>
        {turns.length > 0 && <div className="voice-transcript" aria-label="Conversation transcript">{turns.map((turn, index) => <div key={`${turn.prompt}-${index}`}><small>{turn.prompt}</small><p>{turn.answer}</p></div>)}</div>}
        <form onSubmit={submitAnswer}>
          <button className={`mic-button ${listening ? 'listening' : ''}`} onClick={listen} type="button"><span aria-hidden="true">●</span>{listening ? 'Listening…' : 'Start listening'}</button>
          <label className="answer-fallback">Type your answer<input value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Or type here…" /></label>
          <button className="text-submit" type="submit">Use this answer</button>
        </form>
        <div className="interview-actions">
          <button className="quiet-button" onClick={() => save({ image, evidenceLevel: 'conversational', ...interview.fields })} type="button">Finish and save</button>
          <button className="quiet-button" onClick={() => setMode('choose')} type="button">Back</button>
        </div>
        {error && <p className="inline-error" role="alert">{error}</p>}
      </section>
    )
  }

  return (
    <section className="capture-sheet" aria-labelledby="review-title">
      <button className="sheet-close" onClick={onClose} type="button" aria-label="Close">×</button>
      <div className="capture-preview">{preview ? <img alt="Your captured outfit" src={preview} /> : <span>Photo ready</span>}</div>
      <p className="section-label">PHOTO READY</p>
      <h2 id="review-title">How much time do you have?</h2>
      <div className="capture-options">
        <button className="mobile-primary" disabled={saving} onClick={() => save({ image, evidenceLevel: 'photo_only' })} type="button"><strong>{saving ? 'Saving…' : 'Save quickly'}</strong><small>Photo only · about 2 seconds</small></button>
        <button className="mobile-secondary" onClick={() => setMode('quick')} type="button"><strong>Add quick context</strong><small>Two taps · about 10 seconds</small></button>
        <button className="mobile-secondary voice-choice" onClick={() => setMode('talk')} type="button"><strong>Talk through it</strong><small>Best recommendations · about 45 seconds</small></button>
      </div>
      <button className="retake-button" onClick={() => { setImage(null); setPreview('') }} type="button">Retake photo</button>
      {error && <p className="inline-error" role="alert">{error}</p>}
    </section>
  )
}
