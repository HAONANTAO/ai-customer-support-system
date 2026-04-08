require('dotenv').config()
const path = require('path')
const express = require('express')
const cors = require('cors')
const Anthropic = require('@anthropic-ai/sdk').default
const orders = require('./data/orders')
const kb = require('./data/knowledge-base.json')
const { saveMessage, getHistory, getAdminStats, getRecentSessions } = require('./database')

const app = express()
app.use(cors())
app.use(express.json())

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// sessionId -> message[]
const sessionStore = new Map()
const MAX_HISTORY = 20

// ── Tool definition ──────────────────────────────────────────────────────────
const TOOLS = [
  {
    name: 'query_order',
    description:
      'Look up order status and logistics details by order ID. ' +
      'Call this whenever the user mentions an order number or asks to track / check an order.',
    input_schema: {
      type: 'object',
      properties: {
        order_id: {
          type: 'string',
          description: 'The order ID to look up, e.g. ORD-1001',
        },
      },
      required: ['order_id'],
    },
  },
]

// ── Mock-data lookup ─────────────────────────────────────────────────────────
function queryOrder(orderId) {
  const found = orders.find(
    (o) => o.orderId.toLowerCase() === String(orderId).trim().toLowerCase()
  )
  if (!found) return { found: false, orderId }
  return { found: true, ...found }
}

// ── Knowledge base → system prompt ───────────────────────────────────────────
function buildKbSection(kb) {
  return Object.values(kb)
    .map((section) => `## ${section.title}\n${section.rules.map((r) => `- ${r}`).join('\n')}`)
    .join('\n\n')
}

const SYSTEM_PROMPT = `You are TAO, a friendly and professional AI customer support agent for an e-commerce platform.

=== KNOWLEDGE BASE ===
Use the information below as your PRIMARY reference when answering questions.
If a question cannot be answered from this knowledge base, say you will connect the customer to a human agent.

${buildKbSection(kb)}
=== END KNOWLEDGE BASE ===

Guidelines:
- Always be polite, empathetic, and solution-oriented.
- Answer directly from the knowledge base when possible; do not guess or make up policies.
- If you cannot resolve an issue, say you will connect the customer to a human agent.
- Keep responses concise and clear.
- Respond in the same language the customer uses.`

// ── GET /api/orders (debug) ───────────────────────────────────────────────────
app.get('/api/orders', (_req, res) => {
  res.json(orders)
})

// ── GET /api/history/:sessionId ───────────────────────────────────────────────
app.get('/api/history/:sessionId', (req, res) => {
  res.json(getHistory(req.params.sessionId))
})

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
app.get('/api/admin/stats', (_req, res) => {
  res.json(getAdminStats())
})

// ── GET /api/admin/sessions ───────────────────────────────────────────────────
app.get('/api/admin/sessions', (_req, res) => {
  res.json(getRecentSessions())
})

// ── Transfer detection ────────────────────────────────────────────────────────
const USER_TRANSFER_TRIGGERS = [
  '转人工', '联系客服', '人工客服', '真人客服',
  'human agent', 'contact agent', 'speak to agent',
  'talk to human', 'real person', 'live agent', 'contact support',
]
const AI_TRANSFER_TRIGGERS = [
  'connect you to a human', 'transfer you to', 'human agent',
  '建议联系人工', '为您转接', '联系人工',
]

function detectTransfer(userMessage, aiReply) {
  const userLower = userMessage.toLowerCase()
  const replyLower = aiReply.toLowerCase()
  return (
    USER_TRANSFER_TRIGGERS.some((t) => userLower.includes(t.toLowerCase())) ||
    AI_TRANSFER_TRIGGERS.some((t) => replyLower.includes(t.toLowerCase()))
  )
}

// ── POST /api/chat ────────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { sessionId, message } = req.body

  if (!sessionId || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'sessionId and message are required' })
  }

  // Restore context from DB if this session isn't in memory (e.g. after server restart)
  if (!sessionStore.has(sessionId)) {
    const rows = getHistory(sessionId)
    if (rows.length > 0) {
      const restored = rows.map((r) => ({ role: r.role, content: r.content }))
      sessionStore.set(sessionId, restored.slice(-MAX_HISTORY))
    }
  }
  const history = sessionStore.get(sessionId) ?? []

  // Persist the user message, then append to in-memory history
  saveMessage(sessionId, 'user', message)
  history.push({ role: 'user', content: message })

  try {
    // ── Round 1: ask Claude (with tools available) ───────────────────────────
    const round1 = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: history,
    })

    let reply = ''
    let order = null

    if (round1.stop_reason === 'tool_use') {
      // ── Claude wants to call query_order ──────────────────────────────────

      // 1. Find the tool_use block in Claude's response
      const toolUseBlock = round1.content.find((b) => b.type === 'tool_use')
      const orderId = toolUseBlock.input.order_id

      // 2. Execute the tool locally against mock data
      order = queryOrder(orderId)

      // 3. Add Claude's round-1 response (contains the tool_use block) to history
      history.push({ role: 'assistant', content: round1.content })

      // 4. Add the tool result as a user turn
      history.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolUseBlock.id,
            content: JSON.stringify(order),
          },
        ],
      })

      // ── Round 2: send tool result back so Claude can compose the reply ─────
      const round2 = await client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: history,
      })

      const textBlock = round2.content.find((b) => b.type === 'text')
      reply = textBlock?.text ?? ''

      // Store Claude's final reply as a plain string to keep history clean
      saveMessage(sessionId, 'assistant', reply)
      history.push({ role: 'assistant', content: reply })
    } else {
      // ── Normal turn, no tool call ─────────────────────────────────────────
      const textBlock = round1.content.find((b) => b.type === 'text')
      reply = textBlock?.text ?? ''

      saveMessage(sessionId, 'assistant', reply)
      history.push({ role: 'assistant', content: reply })
    }

    // Trim to the most recent MAX_HISTORY messages
    if (history.length > MAX_HISTORY) {
      history.splice(0, history.length - MAX_HISTORY)
    }
    sessionStore.set(sessionId, history)

    res.json({ reply, order, transfer: detectTransfer(message, reply) })
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

// ── Serve frontend in production ─────────────────────────────────────────────
const frontendDist = path.join(__dirname, '../frontend/dist')
app.use(express.static(frontendDist))
// SPA fallback: serve index.html for any non-API route
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'))
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
