# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Learning Assistant — a desktop learning tool for college students. Uses three AI-powered learning methods: Feynman Technique, First Principles Thinking, and Socratic Questioning.

## Tech Stack

- **Desktop shell**: Electron 42
- **Frontend**: React 18 + TypeScript + Tailwind CSS 3 + Vite 8
- **State**: Zustand
- **Routing**: React Router 6 (HashRouter)
- **Database**: sql.js (SQLite compiled to WASM, no native deps)
- **AI**: Multi-provider (Claude, OpenAI, local/Ollama)

## Commands

```bash
npm run dev          # Start Vite dev server + Electron (auto-launches app)
npm run build        # TypeScript check + Vite production build
npm run electron:build  # Production build + electron-builder packaging
npx vitest           # Run tests
```

## Architecture

```
Electron Shell
├── Main Process (electron/)
│   ├── main.ts              # Entry: creates window, inits DB, registers IPC
│   ├── preload.ts           # contextBridge → window.electronAPI
│   ├── window.ts            # BrowserWindow factory
│   ├── ipc/
│   │   ├── index.ts         # Registers all handlers (DB, settings, app, AI, file)
│   │   ├── database.ipc.ts  # All CRUD handlers for sql.js
│   │   ├── settings.ipc.ts  # Settings + credential management
│   │   ├── app.ipc.ts       # Window controls
│   │   ├── ai.ipc.ts        # AI streaming, completion, test, cancel
│   │   └── file.ipc.ts      # File import, parse, read, delete
│   └── services/
│       ├── ai/
│       │   ├── index.ts         # AI service: streamChat, complete, cancel
│       │   ├── types.ts         # AIProvider interface, ChatMessage, etc.
│       │   └── providers/
│       │       ├── index.ts     # Provider factory (getProvider)
│       │       ├── claude.ts    # Anthropic SDK provider
│       │       ├── openai.ts    # OpenAI SDK provider
│       │       └── local.ts     # Ollama/local fetch-based provider
│       ├── database/
│       │   ├── connection.ts    # sql.js init, DatabaseAdapter wrapper
│       │   └── migrations/      # SQL migration files
│       ├── credential-store.ts  # AES-256-GCM API key encryption
│       └── file-parser/
│           └── index.ts         # PDF, DOCX, MD, TXT parsing + DB save
│
└── Renderer Process (src/)
    ├── App.tsx              # Root + HashRouter + Toaster
    ├── types/               # Shared TypeScript interfaces
    │   ├── database.ts      # Entity types (Subject, Topic, Material, etc.)
    │   └── ipc.ts           # window.electronAPI type declarations
    ├── stores/              # Zustand stores
    │   ├── ui.store.ts      # Theme, sidebar, modal state
    │   ├── settings.store.ts # AI provider config, font size
    │   ├── knowledge.store.ts # Subjects, topics, materials
    │   └── session.store.ts  # Active session, timer
    ├── components/
    │   ├── layout/          # AppLayout, Sidebar, NavigationMenu, StatusBar
    │   ├── dashboard/       # DashboardView with quick-start cards
    │   └── settings/        # SettingsView (API config, appearance)
    └── styles/
        └── globals.css      # Tailwind directives + component classes
```

## Key Design Decisions

- **All I/O in main process**: AI calls, file parsing, DB — renderer never touches filesystem/network directly
- **sql.js over better-sqlite3**: WASM-based, no native compilation needed, avoids Node version issues
- **DatabaseAdapter**: Thin wrapper making sql.js API compatible with better-sqlite3's `prepare().all()/.get()/.run()` pattern
- **HashRouter over BrowserRouter**: Electron only supports file:// protocol in production, hash routing works everywhere
- **IPC is the contract**: All renderer ↔ main communication goes through typed channels defined in `preload.ts`

## Database

Tables: `subjects`, `topics`, `materials`, `study_sessions`, `feynman_attempts`, `first_principles_steps`, `socratic_turns`, `ai_interactions`, `api_credentials`, `app_settings`

Database file: `{userData}/data/learning-assistant.db` — auto-saved every 30s and on quit.
API keys encrypted with AES-256-GCM before storage.

## Implementation Status

- [x] Phase 1: Foundation (Electron shell, DB, settings, layout)
- [x] Phase 2: Knowledge Base — backend done (file parsing: PDF/DOCX/MD/TXT, IPC handlers, DB persistence). Frontend views are placeholders.
- [x] Phase 3: AI Integration — backend done (Claude/OpenAI/Ollama providers, streaming + complete, test connection, cancel). Frontend learning-mode views are placeholders.
- [ ] Phase 4: Feynman Mode (backend exists, needs frontend UI)
- [ ] Phase 5: First Principles Mode (backend exists, needs frontend UI)
- [ ] Phase 6: Socratic Mode (backend exists, needs frontend UI)
- [ ] Phase 7: Progress & Analytics (backend stats queries exist, needs frontend UI)
- [ ] Phase 8: Polish & Packaging
