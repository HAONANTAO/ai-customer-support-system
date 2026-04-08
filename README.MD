# Yun Support — AI Customer Service for E-Commerce

A production-ready AI customer support widget powered by Claude. Features a floating chat interface, real-time order tracking via tool use, multi-turn conversation memory, SQLite persistence, and an admin dashboard — deployed as a single service.

**Live Demo**: _(coming soon)_

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Tailwind CSS v3, bundled with Vite |
| Backend | Node.js + Express 5 |
| AI | Claude Opus 4 (`claude-opus-4-6`) via `@anthropic-ai/sdk` |
| Tool Use | Claude's native tool use API for real-time order lookup |
| Database | SQLite via `better-sqlite3` (conversation history) |

## Features

- **Smart Q&A** — answers grounded in a structured knowledge base (returns, shipping, coupons)
- **Order Tracking** — two-round tool use flow queries mock order data and returns a status card
- **Human Handoff** — detects escalation intent and shows a transfer card with wait time
- **Conversation Memory** — per-session history stored in SQLite, restored across refreshes and server restarts
- **Satisfaction Rating** — 5-star modal triggered on thank-you messages or chat close
- **Admin Dashboard** — `/admin` shows today's stats and expandable conversation threads

---

## Local Development

### 1. Clone and configure

```bash
git clone <your-repo-url>
cd ai-customer-support-system

cp backend/.env.example backend/.env
# Add your ANTHROPIC_API_KEY to backend/.env
```

### 2. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Start both servers

```bash
# Terminal 1 — backend (http://localhost:3001)
cd backend && node server.js

# Terminal 2 — frontend (http://localhost:5173)
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — chat bubble is in the bottom-right corner.  
Admin dashboard: [http://localhost:5173/admin](http://localhost:5173/admin)

---

## Deploy to Railway

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

### 2. Create a Railway project

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your repository — Railway auto-detects `railway.json`

### 3. Set environment variables

In your Railway service → **Variables**:

| Key | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Your key from [console.anthropic.com](https://console.anthropic.com) |
| `NODE_ENV` | `production` |

`PORT` is injected automatically by Railway.

### 4. Deploy

Railway builds (`npm run build`) and starts (`npm start`) automatically on every push to `main`.

---

## Project Structure

```
ai-customer-support-system/
├── package.json            # Root build + start scripts for Railway
├── railway.json            # Railway build/deploy config
├── frontend/
│   ├── src/
│   │   ├── App.tsx                   # Landing page + client-side routing
│   │   ├── components/ChatWidget.tsx # Chat UI, order cards, rating modal
│   │   └── pages/AdminPage.tsx       # Admin dashboard
│   └── vite.config.ts                # Dev proxy: /api → localhost:3001
└── backend/
    ├── server.js                     # Express API + static file serving
    ├── database.js                   # SQLite init and queries
    └── data/
        ├── orders.js                 # Mock orders (ORD-1001–1005)
        └── knowledge-base.json       # FAQ content for system prompt
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | Claude API key |
| `PORT` | auto | Set automatically by Railway |
