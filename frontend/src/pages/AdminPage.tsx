import { useState, useEffect, type ReactNode } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Stats {
  todaySessions: number
  todayMessages: number
  avgTurns: number
}

interface Session {
  session_id: string
  started_at: string
  last_at: string
  message_count: number
  first_message: string | null
}

interface HistoryRow {
  role: string
  content: string
  timestamp: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function preview(text: string | null, len = 48) {
  if (!text) return '(no user message)'
  return text.length <= len ? text : text.slice(0, len) + '…'
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label }: { icon: ReactNode; value: number | string; label: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl bg-[#1a1a2e]/5 flex items-center justify-center text-[#1a1a2e] flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-3xl font-bold text-[#1a1a2e] leading-none">{value}</p>
        <p className="text-sm text-gray-400 mt-1">{label}</p>
      </div>
    </div>
  )
}

// ── Message thread ────────────────────────────────────────────────────────────
function MessageThread({ rows }: { rows: HistoryRow[] }) {
  return (
    <div className="mt-4 space-y-3 px-4 pb-4">
      {rows.map((row, i) => (
        <div key={i} className={`flex ${row.role === 'user' ? 'justify-end' : 'justify-start'} gap-2.5`}>
          {row.role === 'assistant' && (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">
              Y
            </div>
          )}
          <div className="max-w-[75%] space-y-0.5">
            <div
              className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                row.role === 'user'
                  ? 'bg-[#2563eb] text-white rounded-tr-sm'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
              }`}
            >
              {row.content}
            </div>
            <p className={`text-[10px] text-gray-400 ${row.role === 'user' ? 'text-right pr-1' : 'pl-1'}`}>
              {fmtDate(row.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [threads, setThreads] = useState<Record<string, HistoryRow[]>>({})
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then((r) => {
        if (!r.ok) throw new Error(`stats ${r.status}`)
        return r.json()
      }),
      fetch('/api/admin/sessions').then((r) => {
        if (!r.ok) throw new Error(`sessions ${r.status}`)
        return r.json()
      }),
    ])
      .then(([s, sess]) => {
        setStats(s)
        setSessions(sess)
      })
      .catch((e) => setFetchError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function toggleSession(sessionId: string) {
    if (expanded === sessionId) {
      setExpanded(null)
      return
    }
    setExpanded(sessionId)
    if (!threads[sessionId]) {
      const rows: HistoryRow[] = await fetch(
        `/api/history/${sessionId}`
      ).then((r) => r.json())
      setThreads((prev) => ({ ...prev, [sessionId]: rows }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased">
      {/* Header */}
      <header className="bg-[#1a1a2e] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Admin Dashboard</p>
            <p className="text-white/40 text-[11px]">Yun Support</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors bg-transparent border-0 p-0 cursor-pointer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Home
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">Loading…</div>
        ) : fetchError ? (
          <div className="text-center py-20 space-y-2">
            <p className="text-red-400 text-sm font-medium">Failed to load data</p>
            <p className="text-gray-400 text-xs">Make sure the backend is running on port 3001</p>
            <p className="text-gray-300 text-xs font-mono">{fetchError}</p>
          </div>
        ) : (
          <>
            {/* ── Stats ── */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                Today's Overview
              </h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <StatCard
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                    </svg>
                  }
                  value={stats?.todaySessions ?? 0}
                  label="Conversations today"
                />
                <StatCard
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                  }
                  value={stats?.todayMessages ?? 0}
                  label="Messages today"
                />
                <StatCard
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  }
                  value={stats?.avgTurns ?? 0}
                  label="Avg. turns / session"
                />
              </div>
            </section>

            {/* ── Sessions list ── */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                Recent Conversations
              </h2>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                {sessions.length === 0 ? (
                  <p className="text-center py-12 text-gray-400 text-sm">No conversations yet.</p>
                ) : (
                  sessions.map((s) => (
                    <div key={s.session_id}>
                      <button
                        onClick={() => toggleSession(s.session_id)}
                        className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors flex items-center gap-4 border-0 bg-transparent cursor-pointer"
                      >
                        {/* Expand chevron */}
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform duration-200 ${
                            expanded === s.session_id ? 'rotate-90' : ''
                          }`}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>

                        {/* Time */}
                        <span className="text-xs text-gray-400 w-32 flex-shrink-0 font-mono">
                          {fmtDate(s.started_at)}
                        </span>

                        {/* Preview */}
                        <span className="flex-1 text-sm text-gray-700 truncate">
                          {preview(s.first_message)}
                        </span>

                        {/* Turn badge */}
                        <span className="flex-shrink-0 text-[11px] font-semibold bg-gray-100 text-gray-500 rounded-full px-2.5 py-0.5">
                          {s.message_count} msg{s.message_count !== 1 ? 's' : ''}
                        </span>
                      </button>

                      {/* Expanded thread */}
                      {expanded === s.session_id && (
                        <div className="bg-[#f7f8fa] border-t border-gray-100">
                          {threads[s.session_id] ? (
                            <MessageThread rows={threads[s.session_id]} />
                          ) : (
                            <p className="text-center py-6 text-gray-400 text-xs">Loading…</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
