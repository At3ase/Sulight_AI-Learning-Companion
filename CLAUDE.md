# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sulight AI-Learning Companion** (Learning Assistant) — a desktop learning tool for college students. Uses three AI-powered learning methods: Feynman Technique, First Principles Thinking, and Socratic Questioning. Built with Electron + React + TypeScript.

## Tech Stack

- **Desktop shell**: Electron 42
- **Frontend**: React 18 + TypeScript 5.9 + Tailwind CSS 3 + Vite 8
- **State**: Zustand 5 (7 stores)
- **Routing**: React Router 6 (HashRouter)
- **UI primitives**: Radix UI (Dialog, DropdownMenu, Select, Tabs, Tooltip)
- **Charts**: Recharts 3
- **Icons**: Lucide React
- **Database**: sql.js (SQLite compiled to WASM, no native deps)
- **AI**: Multi-provider — Claude (@anthropic-ai/sdk), OpenAI, Ollama (local fetch)
- **Encryption**: AES-256-GCM for API keys
- **File parsing**: pdf-parse + mammoth (DOCX)
- **Markdown**: react-markdown + marked + turndown
- **Logging**: pino

## Commands

```bash
npm run dev           # Start Vite dev server + Electron (auto-launches app)
npm run build         # TypeScript check + Vite production build
npm run electron:build  # Production build + electron-builder packaging (output: 安装包/)
npx vitest            # Run tests
```

## Architecture

```
Electron Shell
├── Main Process (electron/)
│   ├── main.ts              # Entry: creates window, inits DB, registers IPC
│   ├── preload.ts           # contextBridge → window.electronAPI (typed API surface)
│   ├── window.ts            # BrowserWindow factory
│   ├── ipc/
│   │   ├── index.ts         # Registers all handlers (DB, settings, app, AI, file)
│   │   ├── database.ipc.ts  # All CRUD handlers for sql.js (subjects, topics, materials, sessions, cards, achievements, analytics, first_principles, socratic)
│   │   ├── settings.ipc.ts  # Settings + credential management (get/set/reset)
│   │   ├── app.ipc.ts       # Window controls (minimize, maximize, close, isMaximized)
│   │   ├── ai.ipc.ts        # AI streaming, completion, test connection, cancel
│   │   └── file.ipc.ts      # File import (dialog + parse), export (Markdown, Anki CSV, JSON), read, delete
│   └── services/
│       ├── ai/
│       │   ├── index.ts         # AI service: streamChat, complete, cancel (manages request registry)
│       │   ├── types.ts         # AIProvider interface, ChatMessage, StreamCallbacks, etc.
│       │   ├── difficulty-adapter.ts # Adapts difficulty based on user performance
│       │   ├── prompts/         # AI persona system prompts
│       │   │   ├── feynman-persona.ts
│       │   │   ├── first-principles-persona.ts
│       │   │   └── socratic-persona.ts
│       │   └── providers/
│       │       ├── index.ts     # Provider factory (getProvider)
│       │       ├── claude.ts    # Anthropic SDK provider
│       │       ├── openai.ts    # OpenAI SDK provider
│       │       └── local.ts     # Ollama/local fetch-based provider
│       ├── database/
│       │   ├── connection.ts    # sql.js init, DatabaseAdapter wrapper (prepare().all()/.get()/.run())
│       │   └── migrations/
│       │       ├── index.ts     # Migration runner
│       │       └── 001_initial.sql # Full schema (10 tables)
│       ├── review/
│       │   ├── types.ts         # Flashcard, ReviewRating types
│       │   ├── scheduler.ts     # SM-2 spaced repetition algorithm (again/hard/good/easy)
│       │   └── card-generator.ts # AI-powered flashcard generation from session content
│       ├── credential-store.ts  # AES-256-GCM API key encryption + electron-store persistence
│       └── file-parser/
│           └── index.ts         # PDF, DOCX, MD, TXT parsing + DB save with title inference
│
└── Renderer Process (src/)
    ├── App.tsx              # Root: HashRouter + Toaster + KeyboardShortcuts + OnboardingGuard + ErrorBoundary
    ├── main.tsx             # ReactDOM entry
    ├── types/
    │   ├── database.ts      # Entity types (Subject, Topic, Material, StudySession, Flashcard, Achievement, SessionMode, ReviewRating, etc.)
    │   └── ipc.ts           # window.electronAPI type declarations (full typed IPC surface)
    ├── stores/              # Zustand stores
    │   ├── ui.store.ts      # Theme (light/dark/system), sidebar open/closed, modal state
    │   ├── settings.store.ts # Active provider, provider configs, font size, load/save
    │   ├── knowledge.store.ts # Subjects + topics + materials CRUD, selection state
    │   ├── session.store.ts  # Active session lifecycle (start/end/pause/resume), elapsed timer
    │   ├── chat.store.ts     # Per-session message arrays, load/add/update/clear, session cleanup
    │   ├── course.store.ts   # Course CRUD with topics, materials, flashcard counts
    │   └── review.store.ts   # Due cards, review queue, flip state, SM-2 rating dispatch
    ├── components/
    │   ├── layout/
    │   │   ├── AppLayout.tsx       # Shell: Sidebar + NavigationMenu + StatusBar + <Outlet/>
    │   │   ├── Sidebar.tsx         # Collapsible sidebar with nav links + theme toggle
    │   │   ├── NavigationMenu.tsx  # Top nav breadcrumb-style
    │   │   ├── StatusBar.tsx       # Bottom status bar (DB status, timer)
    │   │   └── ErrorBoundary.tsx   # React error boundary with fallback UI
    │   ├── dashboard/
    │   │   ├── DashboardView.tsx        # Welcome banner + 3 quick-start cards + active session + setup reminder
    │   │   ├── DailyReviewWidget.tsx    # "X cards due today" widget
    │   │   ├── ExamCountdownBanner.tsx  # Exam date countdown banner
    │   │   └── SubjectProgressWidget.tsx # Per-subject progress bars
    │   ├── learning-modes/
    │   │   ├── FeynmanView.tsx          # Full chat UI: subject/topic select, material preview, streaming AI, session timer, score gauge, end summary, card generation
    │   │   ├── FirstPrinciplesView.tsx  # Split layout: chat panel + decomposition tree panel (interactive TreeNode with expand/collapse)
    │   │   ├── SocraticView.tsx         # Chat with 7 question-type badges (color-coded), type distribution on summary
    │   │   └── shared/
    │   │       ├── AvatarBubble.tsx     # AI persona avatar (feynman/first_principles/socratic)
    │   │       ├── TypingIndicator.tsx  # Animated typing dots
    │   │       ├── ScoreGauge.tsx       # SVG arc score gauge
    │   │       └── SessionSummary.tsx   # End-of-session summary card with stats
    │   ├── review/
    │   │   ├── ReviewQueue.tsx          # Card queue with progress bar, flip trigger, SM-2 rating buttons (1-4 keyboard shortcuts)
    │   │   └── FlashCard.tsx            # 3D CSS flip card (front=question, back=answer with gradient)
    │   ├── focus/
    │   │   └── FocusModeView.tsx        # Full-screen Pomodoro: SVG ring timer, phase switching (focus/short-break/long-break), settings panel, Web Audio API chime, Notification API
    │   ├── progress/
    │   │   ├── ProgressView.tsx         # Stats cards + AreaChart (score trend) + PieChart (mode dist) + BarChart (daily time) + achievements grid + export buttons
    │   │   └── SessionHistoryView.tsx   # Browseable session history list
    │   ├── knowledge/
    │   │   └── KnowledgeBaseView.tsx    # Subject/topic/material management with file import
    │   ├── courses/
    │   │   ├── CourseListView.tsx       # Course management with embedded topics/materials
    │   │   └── CourseForm.tsx           # Add/edit course form
    │   ├── settings/
    │   │   └── SettingsView.tsx         # Provider config (API keys, endpoints, models) + appearance (theme, font size)
    │   └── onboarding/
    │       └── OnboardingWizard.tsx     # Multi-step first-launch wizard (welcome → config AI → learn modes → done)
    ├── prompts/
    │   ├── feynman-persona.ts           # "小费" persona: encouraging peer, detects jargon/gaps, scores understanding
    │   ├── first-principles-persona.ts  # "原理" persona: Socratic questioning, tree decomposition, identify fundamental truths
    │   └── socratic-persona.ts          # "苏格" persona: 7 question types, never gives direct answers, challenges assumptions
    ├── hooks/
    │   └── useEmotionDetection.ts       # Tracks low-score streaks + idle time → mood (normal/frustrated/confident)
    ├── utils/
    │   └── context-window.ts            # Token-aware context window trimmer (preserves system message + first user msg)
    └── styles/
        └── globals.css                  # Tailwind directives + CSS custom properties (color tokens) + component classes (.card, .btn-primary, .input-field, etc.) + keyframes + 3D flip utilities
```

## Key Design Decisions

- **All I/O in main process**: AI calls, file parsing, DB — renderer never touches filesystem/network directly
- **sql.js over better-sqlite3**: WASM-based, no native compilation needed, avoids Node version issues on Windows
- **DatabaseAdapter**: Thin wrapper making sql.js API compatible with better-sqlite3's `prepare().all()/.get()/.run()` pattern
- **HashRouter over BrowserRouter**: Electron only supports file:// protocol in production, hash routing works everywhere
- **IPC is the contract**: All renderer ↔ main communication goes through typed channels defined in `preload.ts` and declared in `src/types/ipc.ts`
- **Per-session chat store**: Messages keyed by `sessionId` in `chat.store.ts`, with cleanup for old sessions. No cross-session message leakage.
- **SM-2 in main process**: Spaced repetition calculations happen server-side. Cards auto-generated by AI after learning sessions via `review/card-generator.ts`.
- **Stream cleanup**: AI stream listeners are tracked in refs and cleaned up on unmount or new stream start to prevent memory leaks
- **Context window management**: `trimContextWindow()` ensures messages fit within model token limits, preserving system prompt and earliest user message
- **Emotion detection is local**: `useEmotionDetection` hook runs purely in renderer — no IPC, no privacy concerns
- **Chinese-first UX**: All UI text, AI personas, and prompts are in Chinese (target audience: Chinese university students)

## Database

Tables: `subjects`, `topics`, `materials`, `courses`, `flashcards`, `study_sessions`, `feynman_attempts`, `first_principles_steps`, `socratic_turns`, `ai_interactions`, `api_credentials`, `app_settings`, `achievements`

Database file: `{userData}/data/learning-assistant.db` — auto-saved every 30s and on quit.
API keys encrypted with AES-256-GCM before storage via `credential-store.ts`.

## Implementation Status

All 7 phases are complete:

- [x] **Phase 1: Foundation** — Electron shell, sql.js DB with DatabaseAdapter, settings CRUD, AppLayout with Sidebar/Navigation/StatusBar
- [x] **Phase 2: Knowledge Base** — File parsing (PDF/DOCX/MD/TXT), import dialog, KnowledgeBaseView, subject/topic/material CRUD, CourseListView/CourseForm
- [x] **Phase 3: AI Integration** — Claude/OpenAI/Ollama providers, streaming + non-streaming completion, test connection, cancel, difficulty adapter, 3 AI personas with system prompts
- [x] **Phase 4: Feynman Mode** — Full chat UI with streaming, subject/topic/material selection, score gauge, session timer, end summary, auto card generation, emotion detection
- [x] **Phase 5: First Principles Mode** — Split-pane layout (chat + decomposition tree), interactive TreeNode with expand/collapse, fundamental truth detection, leaf counting
- [x] **Phase 6: Socratic Mode** — Chat with 7 question-type badges (color-coded: clarification/assumption/evidence/implication/viewpoint/consequence/origin), turn tracking, type distribution on summary
- [x] **Phase 7: Progress & Analytics** — Stats cards, Recharts (AreaChart score trend, PieChart mode distribution, BarChart daily time), achievement badges with progress bars, weekly report, mastery overview, data export (Markdown/Anki CSV/JSON)
- [x] **Phase 8: Polish & Packaging** — Onboarding wizard, focus/Pomodoro mode, keyboard shortcuts, dark mode, error boundary, electron-builder packaging (Win/Mac/Linux)

### Current Priority Tasks

1. **Add screenshots** to README — capture each major view
2. **Set up GitHub Actions CI** — TypeScript check + build on PR
3. **Create first GitHub Release** — upload the built `安装包/Learning Assistant-1.0.0-win.zip`
4. **Test with real AI providers** — verify streaming works end-to-end with Claude/OpenAI/Ollama
5. **Add unit/integration tests** — currently minimal test coverage in `tests/`
