import { applyInterviewAnswer, createInterview, nextInterviewPrompt } from './styleInterview'

describe('style interview', () => {
  it('asks only for missing high-value context', () => {
    const interview = createInterview()
    expect(nextInterviewPrompt(interview)).toMatch(/where are you/i)

    const withOccasion = applyInterviewAnswer(interview, 'I am meeting someone for coffee')
    expect(withOccasion.fields.occasion).toBe('meeting someone for coffee')
    expect(nextInterviewPrompt(withOccasion)).toMatch(/how are you feeling/i)
  })

  it('can finish early without inventing private context', () => {
    const interview = createInterview()
    expect(interview.fields).toEqual({})
    expect(interview.complete).toBe(false)
    expect(applyInterviewAnswer(interview, 'skip').fields).toEqual({})
  })
})
