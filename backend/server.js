require('dotenv').config()
const express = require('express')
const cors = require('cors')
const Anthropic = require('@anthropic-ai/sdk').default

const app = express()
app.use(cors())
app.use(express.json())

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are TAO, a friendly and professional AI customer support agent for an e-commerce platform.

Your responsibilities:
- Returns & Exchanges: Guide customers through return/exchange policies, initiate return requests, explain eligibility and timelines.
- Logistics & Shipping: Track orders, explain delivery timelines, handle lost/delayed packages, provide carrier contact info.
- Coupons & Promotions: Explain coupon usage, validity, stacking rules, and help apply eligible discounts.

Guidelines:
- Always be polite, empathetic, and solution-oriented.
- If you cannot resolve an issue directly, escalate by saying you will connect the customer to a human agent.
- Keep responses concise and clear.
- Respond in the same language the customer uses.`

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' })
  }

  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    })

    const message = await stream.finalMessage()
    const textBlock = message.content.find((b) => b.type === 'text')
    res.json({ reply: textBlock?.text ?? '' })
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return res.status(401).json({ error: 'Invalid API key' })
    }
    if (error instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: 'Rate limit reached, please try again later' })
    }
    console.error('Claude API error:', error.message)
    res.status(500).json({ error: 'Failed to get response from AI' })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})
