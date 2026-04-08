import { useState, useRef, useEffect } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface OrderData {
  found: boolean
  orderId: string
  product?: string
  status?: string
  carrier?: string
  trackingNo?: string
  estimatedDelivery?: string
}

interface Message {
  id: number
  text: string
  sender: 'user' | 'ai'
  time: string
  order?: OrderData
  transfer?: boolean
}

// ── Constants ─────────────────────────────────────────────────────────────────
const SESSION_KEY = 'tao_session_id'
const RATINGS_KEY = 'tao_ratings'

const THANK_YOU_PHRASES = ['谢谢', '感谢', '谢了', 'thank you', 'thanks', 'thx', 'appreciate']

function getOrCreateSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

function isThankYou(text: string) {
  const lower = text.toLowerCase()
  return THANK_YOU_PHRASES.some((p) => lower.includes(p))
}

function saveRating(sessionId: string, stars: number) {
  const existing = JSON.parse(localStorage.getItem(RATINGS_KEY) ?? '[]')
  existing.push({ sessionId, rating: stars, timestamp: new Date().toISOString() })
  localStorage.setItem(RATINGS_KEY, JSON.stringify(existing))
}

const INITIAL_DISPLAY: Message[] = [
  {
    id: 1,
    text: "Hi! I'm TAO, your AI customer support assistant. I can help you with returns, shipping, and coupons. How can I help you today?",
    sender: 'ai',
    time: fmt(),
  },
]

function fmt() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ── Sub-components ────────────────────────────────────────────────────────────
function RatingModal({ onDone }: { onDone: (stars: number | null) => void }) {
  const [hovered, setHovered] = useState(0)
  const [selected, setSelected] = useState(0)

  return (
    <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10 rounded-2xl">
      <div className="bg-white rounded-2xl shadow-xl p-6 mx-4 w-full max-w-xs space-y-4">
        <div className="text-center space-y-1">
          <p className="font-semibold text-gray-800">How was your experience?</p>
          <p className="text-xs text-gray-400">Your feedback helps us improve.</p>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setSelected(star)}
              className="text-3xl transition-transform hover:scale-110 border-0 bg-transparent p-0 leading-none"
            >
              <span className={(hovered || selected) >= star ? 'text-yellow-400' : 'text-gray-300'}>
                ★
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => selected > 0 && onDone(selected)}
            disabled={selected === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-full transition-colors border-0"
          >
            Submit
          </button>
          <button
            onClick={() => onDone(null)}
            className="w-full text-gray-400 hover:text-gray-600 text-xs py-1 bg-transparent border-0"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}

function TransferCard({ onCancel }: { onCancel: () => void }) {
  const waitMins = useRef(Math.floor(Math.random() * 5) + 1)
  return (
    <div className="mt-2 border border-blue-300 rounded-xl p-3 bg-blue-50 space-y-2 text-xs">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
        <span className="font-semibold text-blue-800 text-sm">Connecting to a human agent…</span>
      </div>
      <p className="text-blue-700">
        Estimated wait time:{' '}
        <span className="font-medium">
          {waitMins.current} minute{waitMins.current > 1 ? 's' : ''}
        </span>
      </p>
      <button
        onClick={onCancel}
        className="text-blue-600 border border-blue-300 rounded-full px-3 py-1 hover:bg-blue-100 transition-colors bg-white"
      >
        Continue with AI instead
      </button>
    </div>
  )
}

function OrderCard({ order }: { order: OrderData }) {
  if (!order.found) {
    return (
      <div className="mt-2 border border-gray-200 rounded-xl p-3 bg-white text-xs text-gray-500">
        Order <span className="font-mono font-medium">{order.orderId}</span> not found.
      </div>
    )
  }

  const shipped = order.status === 'shipped'
  return (
    <div className="mt-2 border border-gray-200 rounded-xl p-3 bg-white space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-mono text-gray-500">{order.orderId}</span>
        <span
          className={`px-2 py-0.5 rounded-full font-medium text-white text-[11px] ${
            shipped ? 'bg-blue-500' : 'bg-green-500'
          }`}
        >
          {shipped ? '发货中' : '已送达'}
        </span>
      </div>
      <p className="font-semibold text-gray-800 text-sm leading-snug">{order.product}</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-gray-500">
        <span>Carrier</span>
        <span className="text-gray-700 font-medium">{order.carrier}</span>
        <span>Tracking</span>
        <span className="font-mono text-gray-700">{order.trackingNo}</span>
        <span>{shipped ? 'Est. Delivery' : 'Delivered on'}</span>
        <span className="text-gray-700 font-medium">{order.estimatedDelivery}</span>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex flex-col items-start">
      <div className="bg-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
        <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(INITIAL_DISPLAY)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [dismissedTransfers, setDismissedTransfers] = useState<Set<number>>(new Set())
  const [showRating, setShowRating] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const sessionId = useRef(getOrCreateSessionId())
  const ratingSubmitted = useRef(false)
  // Called after rating is submitted or skipped; set before showing modal
  const afterRating = useRef<() => void>(() => {})

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing, open])

  const conversationStarted = messages.some((m) => m.sender === 'user')

  // ── Rating ──────────────────────────────────────────────────────────────────
  function triggerRating(onDone: () => void) {
    afterRating.current = onDone
    setShowRating(true)
  }

  function handleRatingDone(stars: number | null) {
    if (stars !== null) saveRating(sessionId.current, stars)
    ratingSubmitted.current = true
    setShowRating(false)
    afterRating.current()
  }

  // ── Close ───────────────────────────────────────────────────────────────────
  function handleClose() {
    if (conversationStarted && !ratingSubmitted.current) {
      triggerRating(() => setOpen(false))
    } else {
      setOpen(false)
    }
  }

  // ── Transfers ───────────────────────────────────────────────────────────────
  function dismissTransfer(id: number) {
    setDismissedTransfers((prev) => new Set(prev).add(id))
  }

  // ── Send ────────────────────────────────────────────────────────────────────
  async function sendText(text: string) {
    if (!text || typing) return

    const thankYou = isThankYou(text)
    const userDisplay: Message = { id: Date.now(), text, sender: 'user', time: fmt() }
    setMessages((prev) => [...prev, userDisplay])
    setInput('')
    setTyping(true)

    try {
      const res = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId.current, message: text }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')

      const reply = data.reply as string
      const order = data.order as OrderData | undefined
      const transfer = data.transfer as boolean | undefined

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: reply, sender: 'ai', time: fmt(), order, transfer },
      ])

      // Show rating after AI replies to a thank-you (don't auto-close, just ask)
      if (thankYou && !ratingSubmitted.current) {
        triggerRating(() => {})
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Something went wrong'
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: `Error: ${errMsg}`, sender: 'ai', time: fmt() },
      ])
    } finally {
      setTyping(false)
    }
  }

  function sendMessage() {
    sendText(input.trim())
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 w-[420px] h-[560px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 z-50">
          {/* Rating modal overlay */}
          {showRating && <RatingModal onDone={handleRatingDone} />}

          {/* Header */}
          <div className="bg-blue-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-white font-semibold text-sm">AI Customer Support</span>
            </div>
            <button
              onClick={handleClose}
              className="text-white/70 hover:text-white text-lg leading-none p-0 border-0 bg-transparent"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="max-w-[75%]">
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-gray-200 text-gray-800 rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.order && <OrderCard order={msg.order} />}
                  {msg.transfer && !dismissedTransfers.has(msg.id) && (
                    <TransferCard onCancel={() => dismissTransfer(msg.id)} />
                  )}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.time}</span>
              </div>
            ))}

            {typing && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {!conversationStarted && (
            <div className="px-3 pt-2 pb-1 bg-white flex flex-wrap gap-2 border-t border-gray-100 flex-shrink-0">
              {[
                'How do I return an item?',
                'Track my order',
                'How to use coupons?',
                'Contact a human agent',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => sendText(q)}
                  className="text-xs text-blue-600 border border-blue-300 rounded-full px-3 py-1 hover:bg-blue-50 transition-colors bg-white"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div
            className={`px-3 py-3 bg-white flex items-center gap-2 flex-shrink-0 ${
              conversationStarted ? 'border-t border-gray-100' : ''
            }`}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={typing}
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 disabled:opacity-60"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || typing}
              className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center flex-shrink-0 transition-colors border-0 p-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating bubble button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center z-50 transition-all duration-200 border-0 p-0"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
          </svg>
        )}
      </button>
    </>
  )
}
