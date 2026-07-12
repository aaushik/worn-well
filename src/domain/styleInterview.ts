export type InterviewFields = {
  occasion?: string
  moodBefore?: string
  liked?: string
  disliked?: string
  comfort?: number
  confidenceAfter?: number
}

export type StyleInterview = {
  fields: InterviewFields
  complete: boolean
}

const prompts: Array<[keyof InterviewFields, string]> = [
  ['occasion', "That's an interesting choice. Where are you going?"],
  ['moodBefore', 'How are you feeling wearing this?'],
  ['liked', 'What is working best about this outfit?'],
  ['disliked', 'Is there anything you would change?'],
  ['comfort', 'How comfortable is it, from one to ten?'],
  ['confidenceAfter', 'And how confident do you feel, from one to ten?'],
]

export function createInterview(): StyleInterview {
  return { fields: {}, complete: false }
}

export function nextInterviewPrompt(interview: StyleInterview) {
  return prompts.find(([field]) => interview.fields[field] === undefined)?.[1] ?? 'That is everything I need. Ready to save it?'
}

export function applyInterviewAnswer(interview: StyleInterview, rawAnswer: string): StyleInterview {
  const answer = rawAnswer.trim()
  if (!answer || answer.toLowerCase() === 'skip') return interview
  const field = prompts.find(([key]) => interview.fields[key] === undefined)?.[0]
  if (!field) return { ...interview, complete: true }

  const fields = { ...interview.fields }
  if (field === 'comfort' || field === 'confidenceAfter') {
    const rating = Number(answer.match(/\d+/)?.[0])
    if (rating >= 1 && rating <= 10) fields[field] = rating
  } else {
    fields[field] = answer.replace(/^i(?:'m| am)\s+/i, '')
  }
  return { fields, complete: prompts.every(([key]) => fields[key] !== undefined) }
}
