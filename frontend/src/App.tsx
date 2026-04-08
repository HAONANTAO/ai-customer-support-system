import { useState, useEffect } from 'react'
import ChatWidget from './components/ChatWidget'
import AdminPage from './pages/AdminPage'
import AuthPage from './pages/AuthPage'

const AUTH_TOKEN_KEY = 'auth_token'

// ── Feature card data ─────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
    title: 'Smart Q&A',
    description:
      'Answers return policies, shipping rules, and coupon questions instantly — grounded in your knowledge base, no hallucinations.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    ),
    title: 'Order Tracking',
    description:
      'Customers type an order ID and get a live status card — carrier, tracking number, and estimated delivery — in one turn.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
    title: 'Human Handoff',
    description:
      'When the AI can\'t resolve an issue, it seamlessly escalates — showing wait time and a one-click option to keep chatting with AI.',
  },
]

const TECH = [
  { label: 'React + TypeScript', note: 'Frontend' },
  { label: 'Node.js + Express', note: 'Backend' },
  { label: 'Claude AI (Opus 4)', note: 'Intelligence' },
  { label: 'Tool Use API', note: 'Order Lookup' },
]

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY))
  const [chatOpen, setChatOpen] = useState(false)
  const [page, setPage] = useState(() =>
    window.location.pathname === '/admin' ? 'admin' : 'home'
  )

  function handleLogin(newToken: string) {
    localStorage.setItem(AUTH_TOKEN_KEY, newToken)
    setToken(newToken)
  }

  function handleLogout() {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    setToken(null)
    setChatOpen(false)
  }

  function navigate(path: string) {
    window.history.pushState(null, '', path)
    setPage(path === '/admin' ? 'admin' : 'home')
  }

  useEffect(() => {
    const handler = () => setPage(window.location.pathname === '/admin' ? 'admin' : 'home')
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  if (!token) return <AuthPage onLogin={handleLogin} />

  if (page === 'admin') return <AdminPage onNavigate={navigate} />

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased">

      {/* ── Navbar ── */}
      <header className="fixed top-0 inset-x-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1a1a2e] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-bold text-[#1a1a2e] text-lg tracking-tight">Yun Support</span>
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors bg-transparent border-0 p-0 cursor-pointer"
            >
              Admin
            </button>
            <button
              onClick={() => setChatOpen(true)}
              className="text-sm font-medium text-[#1a1a2e] border border-gray-300 rounded-full px-5 py-2 hover:bg-gray-50 transition-colors"
            >
              View Demo
            </button>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors bg-transparent border-0 p-0 cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="pt-40 pb-28 px-6 text-center relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-blue-50 to-transparent rounded-full blur-3xl opacity-70" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold rounded-full px-4 py-1.5 mb-8 tracking-wide uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          Powered by Claude AI
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold text-[#1a1a2e] leading-[1.1] tracking-tight max-w-3xl mx-auto">
          AI-Powered Customer&nbsp;Support
          <br />
          <span className="text-[#2563eb]">for E-Commerce</span>
        </h1>

        <p className="mt-6 text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
          Instant answers, real-time order tracking, and seamless human handoff —
          all in a single embeddable chat widget.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            onClick={() => setChatOpen(true)}
            className="bg-[#1a1a2e] hover:bg-[#2d2d4e] text-white font-semibold rounded-xl px-8 py-3.5 text-sm shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Try It Now →
          </button>
          <a
            href="#features"
            className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
          >
            Learn more ↓
          </a>
        </div>

        {/* Floating preview card */}
        <div className="mt-16 max-w-sm mx-auto bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden text-left">
          <div className="bg-[#1a1a2e] px-4 py-3 flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">Y</div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#1a1a2e]" />
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Yun · AI Support</p>
              <p className="text-emerald-400 text-[10px]">● Online</p>
            </div>
          </div>
          <div className="p-4 space-y-3 bg-[#f7f8fa]">
            <div className="flex gap-2.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">Y</div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-3 py-2 text-xs text-gray-700 shadow-sm max-w-[75%]">
                Hi! I'm Yun. How can I help you today?
              </div>
            </div>
            <div className="flex justify-end">
              <div className="bg-[#2563eb] text-white rounded-2xl rounded-tr-sm px-3 py-2 text-xs max-w-[70%]">
                Where is my order ORD-1003?
              </div>
            </div>
            <div className="flex gap-2.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">Y</div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-3 py-2 text-xs text-gray-700 shadow-sm max-w-[75%]">
                Your Mechanical Keyboard is on the way via DHL — arriving Apr 14.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#1a1a2e] tracking-tight">Everything you need</h2>
            <p className="mt-3 text-gray-500">Built on Claude's tool use API for accurate, real-time responses.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center mb-5">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-[#1a1a2e] text-base mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech stack ── */}
      <footer className="py-16 px-6 bg-[#1a1a2e]">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-8">Built with</p>
          <div className="flex flex-wrap justify-center gap-6">
            {TECH.map((t) => (
              <div key={t.label} className="text-center">
                <p className="text-white font-semibold text-sm">{t.label}</p>
                <p className="text-white/40 text-xs mt-0.5">{t.note}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-white/25 text-xs">
              Yun Support · AI customer service demo · Powered by Anthropic Claude
            </p>
          </div>
        </div>
      </footer>

      {/* Chat widget lives at the page level */}
      <ChatWidget open={chatOpen} onOpenChange={setChatOpen} token={token!} onUnauthorized={handleLogout} />
    </div>
  )
}
