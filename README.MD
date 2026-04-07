# AI Customer Support System

An e-commerce AI customer support chat widget powered by Claude. Features a floating chat bubble with a real-time conversation interface backed by a Node.js/Express API.

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS (Vite)
- **Backend**: Node.js + Express
- **AI**: Claude API (`claude-opus-4-6`) via `@anthropic-ai/sdk`

## Project Structure

```
ai-customer-support-system/
├── frontend/   # React app
└── backend/    # Express API server
```

## Setup

### 1. Configure the API key

```bash
cp backend/.env.example backend/.env
# Edit backend/.env and set your ANTHROPIC_API_KEY
```

### 2. Install dependencies

```bash
cd frontend && npm install
cd ../backend && npm install
```

### 3. Start both servers

```bash
# Terminal 1 — backend (port 3001)
cd backend && node server.js

# Terminal 2 — frontend (port 5173)
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and click the chat bubble in the bottom-right corner.

## AI Agent

The assistant is named **TAO** and handles:
- Returns & Exchanges
- Shipping & Logistics
- Coupons & Promotions

It responds in the same language the customer uses.
