# INP Debugger Task List

This document tracks the progress of the INP Debugger project.

## Phase 1: Foundation & Project Setup
- [x] Initialize project structure (JavaScript focus) <!-- id: 0 -->
- [x] Setup `docs/prd.md` and `docs/technical-design.md` <!-- id: 1 -->
- [ ] Integrate Swagger for API documentation <!-- id: 2 -->
- [ ] Configure `apps/web` (Preact + Tailwind) <!-- id: 3 -->
- [ ] Configure `apps/server` (Bun + Elysia + JavaScript) <!-- id: 4 -->
- [ ] Configure `apps/desktop` (Tauri wrapper) <!-- id: 5 -->

## Phase 2: Measurement Engine
- [ ] Setup Playwright with Chromium <!-- id: 6 -->
- [ ] Implement `web-vitals` attribution injection (JS) <!-- id: 7 -->
- [ ] Implement Interaction Discovery module <!-- id: 8 -->
- [ ] Implement Scripted Interaction Replay <!-- id: 9 -->
- [ ] Implement CDP-based Long Task correlation <!-- id: 10 -->

## Phase 3: Core Logic & Storage
- [ ] Implement INP scoring and ranking logic <!-- id: 11 -->
- [ ] Setup SQLite schema with `bun:sqlite` <!-- id: 12 -->
- [ ] Implement Data Access Layer (JS) <!-- id: 13 -->

## Phase 4: API & Frontend Integration
- [ ] Implement `POST /api/analyze` (Measurement orchestration) <!-- id: 14 -->
- [ ] Implement `GET /api/results/:jobId` and `GET /api/history` <!-- id: 15 -->
- [ ] Build Preact Dashboard UI (Run Form, Progress, Results) <!-- id: 16 -->
- [ ] Implement Live Progress via SSE <!-- id: 17 -->

## Phase 5: Desktop Packaging (Tauri)
- [ ] Configure Tauri build for macOS, Linux, and Windows <!-- id: 18 -->
- [ ] Bundle Frontend and Backend into the Tauri app <!-- id: 19 -->

## Phase 6: Polish & Advanced Features
- [ ] Implement HTML Report Export <!-- id: 21 -->
- [ ] Implement Interaction Heatmap <!-- id: 22 -->
- [ ] Add Root-Cause Heuristics <!-- id: 23 -->
- [ ] CI Budget-Check CLI tool <!-- id: 24 -->
