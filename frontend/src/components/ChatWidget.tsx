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

interface ChatWidgetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ── Constants ─────────────────────────────────────────────────────────────────
const SESSION_KEY = 'tao_session_id'
const RATINGS_KEY = 'tao_ratings'

const THANK_YOU_PHRASES = ['thank you', 'thanks', 'thx', 'appreciate', 'great help', 'helpful']

function getOrCreateSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

function fmtFromISO(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
    text: "Hi! I'm Yun, your AI support assistant. I can help with returns, order tracking, and coupons. How can I help you today?",
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
  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']

  return (
    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20 rounded-2xl backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl shadow-2xl p-6 mx-5 w-full space-y-5">
        <div className="text-center space-y-1">
          <p className="font-semibold text-gray-900 text-base">How was your experience?</p>
          <p className="text-xs text-gray-400">Your feedback helps us improve.</p>
        </div>

        <div className="flex justify-center gap-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setSelected(star)}
              className="text-4xl transition-transform hover:scale-125 border-0 bg-transparent p-0 leading-none"
            >
              <span className={(hovered || selected) >= star ? 'text-yellow-400' : 'text-gray-200'}>★</span>
            </button>
          ))}
        </div>

        {(hovered || selected) > 0 && (
          <p className="text-center text-sm font-medium text-gray-500 -mt-2">
            {labels[hovered || selected]}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <button
            onClick={() => selected > 0 && onDone(selected)}
            disabled={selected === 0}
            className="w-full bg-[#1a1a2e] hover:bg-[#2d2d4e] disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-xl transition-colors border-0"
          >
            Submit feedback
          </button>
          <button
            onClick={() => onDone(null)}
            className="w-full text-gray-400 hover:text-gray-600 text-xs py-1 bg-transparent border-0 transition-colors"
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
    <div className="mt-2 border border-blue-200 rounded-xl p-3 bg-blue-50 space-y-2.5 text-xs">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
        <span className="font-semibold text-blue-900 text-[13px]">Connecting to a human agent…</span>
      </div>
      <p className="text-blue-700">
        Estimated wait:{' '}
        <span className="font-semibold">{waitMins.current} min{waitMins.current > 1 ? 's' : ''}</span>
      </p>
      <button
        onClick={onCancel}
        className="text-blue-600 border border-blue-200 rounded-full px-3 py-1 hover:bg-blue-100 transition-colors bg-white text-[11px] font-medium"
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
        Order <span className="font-mono font-medium text-gray-700">{order.orderId}</span> not found.
      </div>
    )
  }

  const shipped = order.status === 'shipped'
  return (
    <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden bg-white text-xs shadow-sm">
      <div className="px-3 py-2.5 flex items-center justify-between border-b border-gray-100">
        <span className="font-mono text-gray-400 text-[11px]">{order.orderId}</span>
        <span
          className={`px-2.5 py-0.5 rounded-full font-semibold text-white text-[10px] tracking-wide ${
            shipped ? 'bg-blue-500' : 'bg-emerald-500'
          }`}
        >
          {shipped ? 'Shipped' : 'Delivered'}
        </span>
      </div>
      <div className="px-3 py-2.5 space-y-2">
        <p className="font-semibold text-gray-800 text-[13px] leading-snug">{order.product}</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-gray-400">
          <span>Carrier</span>
          <span className="text-gray-700 font-medium">{order.carrier}</span>
          <span>Tracking</span>
          <span className="font-mono text-gray-600">{order.trackingNo}</span>
          <span>{shipped ? 'Est. Delivery' : 'Delivered'}</span>
          <span className="text-gray-700 font-medium">{order.estimatedDelivery}</span>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({
  msg,
  dismissedTransfers,
  onDismissTransfer,
}: {
  msg: Message
  dismissedTransfers: Set<number>
  onDismissTransfer: (id: number) => void
}) {
  if (msg.sender === 'ai') {
    return (
      <div className="flex flex-col items-start">
        <div className="flex items-start gap-2.5 w-full">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 mt-0.5 shadow-sm">
            Y
          </div>
          <div className="max-w-[80%] space-y-1">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-gray-800 leading-relaxed shadow-sm">
              {msg.text}
            </div>
            {msg.order && <OrderCard order={msg.order} />}
            {msg.transfer && !dismissedTransfers.has(msg.id) && (
              <TransferCard onCancel={() => onDismissTransfer(msg.id)} />
            )}
            <span className="text-[10px] text-gray-400 pl-1">{msg.time}</span>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-end">
      <div className="max-w-[80%] space-y-1">
        <div className="bg-[#2563eb] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed">
          {msg.text}
        </div>
        <span className="text-[10px] text-gray-400 flex justify-end pr-1">{msg.time}</span>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 mt-0.5 shadow-sm">
        Y
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ChatWidget({ open, onOpenChange }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_DISPLAY)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [dismissedTransfers, setDismissedTransfers] = useState<Set<number>>(new Set())
  const [showRating, setShowRating] = useState(false)

  const [historyMessages, setHistoryMessages] = useState<Message[]>([])

  const bottomRef = useRef<HTMLDivElement>(null)
  const sessionId = useRef(getOrCreateSessionId())
  const ratingSubmitted = useRef(false)
  const afterRating = useRef<() => void>(() => {})
  const historyFetched = useRef(false)

  // Fetch persisted history once on first open
  useEffect(() => {
    if (open && !historyFetched.current) {
      historyFetched.current = true
      fetch(`/api/history/${sessionId.current}`)
        .then((r) => r.json())
        .then((rows: { role: string; content: string; timestamp: string }[]) => {
          const msgs: Message[] = rows.map((row, i) => ({
            id: -(i + 1), // negative IDs, no collision with current session
            text: row.content,
            sender: row.role === 'user' ? 'user' : 'ai',
            time: fmtFromISO(row.timestamp),
          }))
          setHistoryMessages(msgs)
        })
        .catch(() => {}) // fail silently — chat still works without history
    }
  }, [open])

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, historyMessages, typing, open])

  const conversationStarted = messages.some((m) => m.sender === 'user')

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

  function handleClose() {
    if (conversationStarted && !ratingSubmitted.current) {
      triggerRating(() => onOpenChange(false))
    } else {
      onOpenChange(false)
    }
  }

  function dismissTransfer(id: number) {
    setDismissedTransfers((prev) => new Set(prev).add(id))
  }

  async function sendText(text: string) {
    if (!text || typing) return

    const thankYou = isThankYou(text)
    setMessages((prev) => [...prev, { id: Date.now(), text, sender: 'user', time: fmt() }])
    setInput('')
    setTyping(true)

    try {
      const res = await fetch('/api/chat', {
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

      if (thankYou && !ratingSubmitted.current) triggerRating(() => {})
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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendText(input.trim())
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 w-[380px] h-[600px] bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden z-50">
          {showRating && <RatingModal onDone={handleRatingDone} />}

          {/* Header */}
          <div className="bg-[#1a1a2e] px-4 py-3.5 flex items-center gap-3 flex-shrink-0">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-inner">
                Y
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#1a1a2e]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-tight">Yun · AI Support</p>
              <p className="text-emerald-400 text-[11px] font-medium mt-0.5">● Online</p>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors border-0 bg-transparent flex-shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#f7f8fa]">

            {/* ── Persisted history ── */}
            {historyMessages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                dismissedTransfers={dismissedTransfers}
                onDismissTransfer={dismissTransfer}
              />
            ))}

            {/* ── History / current session divider ── */}
            {historyMessages.length > 0 && (
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                  — Chat history above —
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            )}

            {/* ── Current session messages ── */}
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                dismissedTransfers={dismissedTransfers}
                onDismissTransfer={dismissTransfer}
              />
            ))}

            {typing && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {!conversationStarted && (
            <div className="px-3 pt-2.5 pb-2 bg-white border-t border-gray-100 flex flex-wrap gap-1.5 flex-shrink-0">
              {['How do I return an item?', 'Track my order', 'How to use coupons?', 'Contact a human agent'].map((q) => (
                <button
                  key={q}
                  onClick={() => sendText(q)}
                  className="text-[12px] text-[#2563eb] border border-blue-200 rounded-full px-3 py-1 hover:bg-blue-50 transition-colors bg-white font-medium"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="bg-white border-t border-gray-100 flex-shrink-0">
            <div className="px-3 pt-3 pb-1 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                disabled={typing}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-gray-400 disabled:opacity-50 transition-shadow"
              />
              <button
                onClick={() => sendText(input.trim())}
                disabled={!input.trim() || typing}
                className="w-9 h-9 bg-[#2563eb] hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors border-0 p-0 shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-300 pb-2.5 pt-1 select-none tracking-wide">
              Powered by Claude AI
            </p>
          </div>
        </div>
      )}

      {/* Floating bubble */}
      <button
        onClick={() => onOpenChange(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#1a1a2e] hover:bg-[#2d2d4e] text-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex items-center justify-center z-50 transition-all duration-200 border-0 p-0"
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
