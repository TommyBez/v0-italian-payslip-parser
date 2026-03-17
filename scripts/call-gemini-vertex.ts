import { generateText } from 'ai'

async function callGeminiVertex() {
  const result = await generateText({
    model: 'google/gemini-3-flash',
    prompt: 'What is the capital of France?',
    providerOptions: {
      gateway: {
        only: ['vertex'],
      },
    },
  })

  console.log('Model:', result.model)
  console.log('Text:', result.text)
  console.log('Usage:', {
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
  })
}

callGeminiVertex().catch(console.error)
