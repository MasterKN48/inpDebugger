# INP Debugger Task List

This document tracks the progress of the INP Debugger project.

## Phase 1: Foundation & Project Setup

- [x] Initialize project structure (JavaScript focus) <!-- id: 0 -->
- [x] Setup `docs/prd.md` and `docs/technical-design.md` <!-- id: 1 -->
- [x] Integrate Swagger for API documentation <!-- id: 2 -->
- [x] Configure `apps/web` (Preact + Tailwind) <!-- id: 3 -->
- [x] Configure `apps/server` (Bun + Elysia + JavaScript) <!-- id: 4 -->
- [x] Configure `apps/desktop` (Tauri wrapper) <!-- id: 5 -->

## Phase 2: Measurement Engine

- [x] Setup Playwright with Chromium <!-- id: 6 -->
- [x] Implement `web-vitals` attribution injection (JS) <!-- id: 7 -->
- [x] Implement Interaction Discovery module <!-- id: 8 -->
- [x] Implement Scripted Interaction Replay <!-- id: 9 -->
- [x] Implement CDP-based Long Task correlation <!-- id: 10 -->

## Phase 3: Core Logic & Storage

- [x] Implement INP scoring and ranking logic <!-- id: 11 -->
- [x] Setup SQLite schema with `bun:sqlite` <!-- id: 12 -->
- [x] Implement Data Access Layer (JS) <!-- id: 13 -->

## Phase 4: API & Frontend Integration

- [x] Implement `POST /api/analyze` (Measurement orchestration) <!-- id: 14 -->
- [x] Implement `GET /api/results/:jobId` and `GET /api/history` <!-- id: 15 -->
- [x] Build Preact Dashboard UI (Run Form, Progress, Results) <!-- id: 16 -->
- [x] Implement Live Progress via SSE / State Polling Loop <!-- id: 17 -->

## Phase 5: Desktop Packaging (Tauri)

- [x] Configure Tauri build for macOS, Linux, and Windows <!-- id: 18 -->
- [x] Bundle Frontend and Backend into the Tauri app <!-- id: 19 -->

## Phase 6: Polish & Advanced Features

- [x] Implement HTML Report Export <!-- id: 21 -->
- [x] Implement Interaction Heatmap <!-- id: 22 -->
- [x] Add Root-Cause Heuristics <!-- id: 23 -->

## Phase 7: Production Security, Performance & Branding Upgrades

- [x] Implement multi-threaded background analysis via Audit Worker Thread (`worker_threads`) <!-- id: 25 -->
- [x] Establish secure dotenv `.env` configuration mapping on backend and frontend <!-- id: 26 -->
- [x] Configure Pino logger with level-filtering, structured JSON (prod), and pretty-printing (dev) <!-- id: 27 -->
- [x] Add global API exception boundary middleware with HTTP 500 error sanitization <!-- id: 28 -->
- [x] Implement standard API response envelopes (`status`, `data`, `error`, `timestamp`) <!-- id: 29 -->
- [x] Harden routes with OWASP security headers (XSS, Clickjacking, MIME sniffing, HSTS) <!-- id: 30 -->
- [x] Integrate basic client-server API key validation via `X-API-Key` headers <!-- id: 31 -->
- [x] Build and mount canvas-based dynamic neon pulsing lightning bolt browser favicon <!-- id: 32 -->
- [x] Upgrade homepage header icon with intense ambient shadow bloom and hover effects <!-- id: 33 -->
- [x] Integrate ESLint Flat Config (`eslint.config.js`) covering monorepo FE, BE, and packages <!-- id: 34 -->
- [x] Implement Husky pre-commit hooks (`.husky/pre-commit`) running automatic workspace-wide linting before commits <!-- id: 35 -->
- [x] Harmonize Elysia standard JSON response mapping with Preact store data extraction patterns (fixing 'jobId' of undefined errors) <!-- id: 36 -->
- [x] Establish a hybrid memory architecture implementing transient relational SQLite memory tables (`:memory:`) for job progress and state tracking <!-- id: 37 -->
- [x] Migrate all server-side Playwright/Chromium measurement engine logs to use the shared Pino logger package <!-- id: 38 -->
- [x] Fix Bun SQLite query cache double-free native SIGTRAP crash by compiling prepared statements outside manual transaction blocks <!-- id: 39 -->
- [x] Resolve transient async SIGTRAP crashes by pre-compiling all in-memory (`memDb`) relational prepared statements at the module startup level <!-- id: 40 -->
- [x] Prevent thread double-termination panics by removing redundant parent-side worker.terminate() calls on naturally self-closing Web Workers <!-- id: 41 -->
- [x] Optimize interaction discovery and replay to instantly filter out and bypass disabled elements, preventing Playwright 4s click timeouts <!-- id: 42 -->
- [x] Fix field mapping mismatch in MetricCards to correctly show Event Trigger, Total Latency, DOM Node Markup, and dynamic Interaction Score <!-- id: 43 -->
