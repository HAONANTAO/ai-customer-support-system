# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

E-commerce AI customer support system. A floating chat widget (React frontend) backed by a Node.js/Express API that calls the Claude API to power a customer support agent named TAO.

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS v3, bundled with Vite 4
- **Backend**: Node.js + Express, using `@anthropic-ai/sdk`
- **AI Model**: `claude-opus-4-6`

## Commands

```bash
# Frontend (runs on http://localhost:5173)
cd frontend && npm run dev

# Backend (runs on http://localhost:3001)
cd backend && node server.js
```

## Architecture

```
frontend/src/
  App.tsx                    # Root: renders ChatWidget on a placeholder page
  components/ChatWidget.tsx  # All chat UI and API logic lives here

backend/
  server.js                  # Express server — single POST /api/chat endpoint
  .env                       # ANTHROPIC_API_KEY (not committed)
  .env.example               # Template (no real keys)
```

**Data flow:** `ChatWidget` maintains two parallel states — `messages` (display, with UI metadata) and `history` (API format: `{role, content}[]`). On each send, the full `history` is POSTed to `/api/chat`, which forwards it to Claude with the TAO system prompt and returns `{ reply: string }`.

## Code Conventions

- Functional components only, no class components
- All API endpoints must include error handling with typed Anthropic SDK exceptions
- Keep `messages` (display state) and `history` (API state) in sync on every turn — both must be updated together
- The backend reads `ANTHROPIC_API_KEY` from environment variables only; never hard-code keys
