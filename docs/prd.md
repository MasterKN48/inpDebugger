# PRD: INP Debugger

## Problem Statement
Measuring Interaction to Next Paint (INP) is critical for modern web performance, but current tools like PageSpeed Insights or DebugBear are often restricted by network access (cannot test local/staging/authenticated environments) or are part of heavy suites. Developers need a fast, lightweight, and self-hostable tool dedicated specifically to INP diagnostics across all environments.

## Target Users
- Frontend Performance Engineers
- Web Developers debugging interaction lag
- QA/Automated Testing Engineers tracking regressions

## Core Jobs to be Done
- **Identify slow interactions:** Automatically find elements that trigger slow paints.
- **Explain the "Why":** Break down the INP score into Input Delay, Processing Duration, and Presentation Delay.
- **Track Regressions:** Compare current runs against historical data to spot performance drops.
- **Test Anywhere:** Run against localhost, authenticated dashboards, and staging environments.

## Scope
### In Scope
- INP measurement and scoring.
- Interaction discovery (buttons, links, custom roles).
- Scripted interaction replay.
- Phase-based latency breakdown.
- Local historical persistence.
- Desktop application delivery (Tauri).

### Non-Goals
- LCP/CLS/FCP auditing.
- SEO or accessibility auditing.
- Network waterfall analysis.
- Generic browser automation.

## MVP Definition (Desktop Only)
A functional macOS/Linux/Windows desktop app that allows a user to:
1. Enter a URL.
2. Run an automated INP scan.
3. View the worst interaction and its phase breakdown.
4. See a history of previous scans.

## Feature Priorities
1. **P0:** Accurate phase-based INP measurement in Chromium.
2. **P0:** Basic interaction discovery.
3. **P1:** Result persistence and history view.
4. **P1:** Scripted interaction support.
5. **P2:** Regression comparison UI.
6. **P2:** HTML report export.

## UX Expectations
- **Lightweight & Fast:** Minimal memory footprint and startup time.
- **Engineering-first:** Utilitarian, dense information, minimal "fluff".
- **Fast Feedback:** Real-time progress indicators during scans.
- **Diagnostic Clarity:** Clear visual cues for "Good", "Needs Improvement", and "Poor" scores.
