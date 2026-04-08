# Yun Support — AI Customer Support System

![screenshot](./screenshot.png)

An AI-powered customer support system for e-commerce, built with Claude. Features a floating chat widget, real-time order lookup via Tool Use, multi-turn conversation memory, SQLite persistence, and an admin dashboard — deployed as a single service.

**Live Demo**: [https://ai-customer-support-system-production-46f1.up.railway.app](https://ai-customer-support-system-production-46f1.up.railway.app)

---

## Features

- **Smart Q&A** — answers grounded in a structured knowledge base covering returns, shipping, and coupons; never makes up policies
- **Order Tracking via Tool Use** — Claude's native Tool Use API drives a two-round call cycle: detects order numbers, queries live data, and renders a status card
- **Multi-turn Memory** — each session maintains independent context, supporting follow-up questions naturally
- **Persistent History** — all messages stored in SQLite; conversation history survives page refreshes and server restarts
- **Human Handoff Detection** — recognizes escalation intent from both user and AI, displays a transfer card
- **Satisfaction Rating** — 5-star rating modal triggered on conversation close or thank-you messages
- **Admin Dashboard** — `/admin` shows today's stats and expandable full conversation threads

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Tailwind CSS v3, bundled with Vite 4 |
| Backend | Node.js + Express 5 |
| AI | Claude Opus 4 (`claude-opus-4-6`) via `@anthropic-ai/sdk` |
| Tool Use | Claude's native Tool Use API for real-time order lookup |
| Database | SQLite via `better-sqlite3` (conversation history) |

---

## Project Highlights

### Tool Use — More Than a Chat Demo

Most AI chat demos only do text Q&A. This project uses Claude's **Tool Use** to implement a real order lookup flow:

```
User: Can you check the status of ORD-1002?
  ↓
Claude decides to call the query_order tool
  ↓
Backend executes the query and returns order data
  ↓
Claude composes a natural language reply using the result
  ↓
Frontend renders an order card with logistics details
```

This is a full two-round API call chain (Round 1: tool-call decision → Round 2: reply generation from result) — the same pattern used in production AI agents.

### Single-Service Full-Stack Deployment

The Express backend serves both the API and the compiled frontend static files. One Railway service, no separate frontend hosting needed.

---

## Local Development

### 1. Clone & configure

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

Open [http://localhost:5173](http://localhost:5173) — the chat bubble is in the bottom-right corner.  
Admin dashboard: [http://localhost:5173/admin](http://localhost:5173/admin)

---

## Deploy to Railway

### 1. Push to GitHub

```bash
git add .
git commit -m "deploy"
git push origin main
```

### 2. Create a Railway project

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your repository — Railway auto-detects `railway.json`

### 3. Set environment variables

Railway service → **Variables**:

| Key | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Your key from [console.anthropic.com](https://console.anthropic.com) |
| `PORT` | `8080` (Railway default) |

### 4. Configure domain

**Settings → Domains → Generate Service Domain**, set target port to `8080`.

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
        └── knowledge-base.json       # Knowledge base for system prompt
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | Claude API key |
| `PORT` | auto | Injected by Railway, defaults to 8080 |
