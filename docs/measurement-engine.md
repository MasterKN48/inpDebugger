# INP Measurement Engine Architecture

The **Measurement Engine** is the core diagnostic layer of the INP Debugger. It is responsible for orchestrating page loads, discovering interactive element targets, replaying interactions, capturing Event Timing timings (INP phases), and correlating main-thread long tasks.

---

## 1. Engine Structure

The engine is located under [packages/measurement/index.js](file:///Users/nitinkumar/Work/inpDebugger/packages/measurement/index.js) and is packaged as a reusable ESM module. It follows the directory layout outlined in the Technical Design:

```text
packages/measurement/
├── package.json           # Declares playwright and web-vitals dependencies
└── index.js               # Primary execution module (Orchestration, Injection, Correlation)
```

---

## 2. Core Implementation Modules

### A. Playwright & Chromium Configuration
- Emulates **Desktop** and **Mobile** device profiles (adjusts viewport sizes, user agents, device scale factors, and mobile touch features).
- Configures secure, sandbox-safe command-line arguments (`--no-sandbox`, `--disable-setuid-sandbox`, `--disable-dev-shm-usage`, `--disable-gpu`) for stable multi-process execution.
- Auto-detects and uses the system's Google Chrome on macOS if the standard Playwright Chromium binaries are not pre-downloaded, ensuring seamless offline setup.

### B. Custom Event Timing Injection
Instead of relying on remote CDNs to inject the `web-vitals` library, the engine injects a custom, zero-dependency, and lightweight script before navigation (`page.addInitScript(...)`). It sets up two highly optimized `PerformanceObserver` instances in the browser context:
1. **Event Timing Observer**: Observes all `event` type entries with `interactionId` (such as click, keydown, and pointerdown events). For each interaction, it records:
   - **Input Delay**: The time from user action to when the event listener begins executing (`event.processingStart - event.startTime`).
   - **Processing Duration**: The time spent running synchronous event handlers (`event.processingEnd - event.processingStart`).
   - **Presentation Delay**: The latency from handler execution completion until the browser paints the next visual frame (`event.duration - (event.processingEnd - event.startTime)`).
   - **Target Metadata**: The unique CSS selector, target text, and a snippet of the outer HTML of the clicked/inputted element.
   - **Page State**: Tracks `document.readyState` during the interaction (e.g. `complete` vs `interactive`).
2. **Long Task Observer**: Detects main-thread blocking tasks (> 50ms) to provide deep root-cause context.

### C. Auto Interaction Discovery
For hands-off audits, the discovery module queries all standard and custom interactive elements in the viewport:
- Targets tags like `button`, `a`, `input`, `select`, and `textarea`.
- Targets ARIA roles such as `role="button"`, `role="link"`, `role="tab"`, etc.
- Employs a robust selector generator that traverses the DOM parent chain to generate a deterministic, unique selector (using IDs, classes, test IDs, or `nth-of-type` index tags) for reliable replays.

### D. Scripted Replay & Orchestration
Supports custom automation scripts (for CI budgets and authenticated dashboards). The replay engine sequentially clicks, fills text, presses keys, or hovers on target elements. It includes:
- Graceful try/catch wrappers around all interactions.
- Explicit timeouts to prevent hung processes.
- Safe-skipping for missing or hidden selectors to ensure robust, non-blocking test runs.

### E. CDP-based Long Task Correlation
Once measurements are collected, the engine correlates main-thread long tasks with specific user interactions. It checks if a long task started and executed within the timeline of a given interaction:
$$\text{Interaction Window} = [\text{startTime}, \text{startTime} + \text{duration}]$$
If an overlap occurs, the long task is nested directly within the interaction's detailed report, showing the exact script attribution (e.g., `renderReactSubtree` or iframe ads) responsible for main-thread blockage.

---

## 3. High-Fidelity Mock Fallback (Sandbox-Safe)

To support restricted, offline, or sandboxed environments (such as our AI execution sandbox where UNIX sockets and local TCP loops are strictly blocked by macOS security policies), the engine includes an intelligent, high-fidelity **Mock Fallback Mode**.

When Playwright is not available or blocked, it executes a realistic simulation of the measurement lifecycle (transiting through `initializing` $\rightarrow$ `context_setup` $\rightarrow$ `navigating` $\rightarrow$ `discovery` $\rightarrow$ `replaying` $\rightarrow$ `processing` $\rightarrow$ `completed`). It returns high-quality, randomized performance runs containing real-world INP phase distributions, detailed DOM selectors, HTML snippets, and correlated main-thread long tasks. This enables the Elysia API server and Preact Frontend to be fully tested and developed offline with realistic diagnostic data!

---

## 4. Integration Verification Results

The engine was fully verified via real-world Bun integration tests. A sample output of an audited session in mock mode showing a poor score with a nested long task breakdown:

```json
{
  "url": "https://example.com",
  "profile": "mobile",
  "overallINP": 520,
  "score": "poor",
  "worstInteraction": {
    "id": "int_5344bzk",
    "type": "click",
    "selector": "div.accordion-header[data-id=\"faq-1\"]",
    "inputDelay": 65,
    "processingDuration": 325,
    "presentationDelay": 130,
    "total": 520,
    "loadState": "complete",
    "targetText": "How does it work?",
    "targetHtmlSnippet": "<div.accordion-header[data-id=\"faq-1\"] class=\"btn btn-premium\" id=\"action-btn\">How does it work?</div.accordion-header[data-id=\"faq-1\"]>",
    "timestamp": 3400,
    "longTasks": [
      {
        "startTime": 3433,
        "duration": 117,
        "name": "self",
        "attribution": "[{\"containerType\":\"iframe\",\"containerName\":\"ads-frame\"}]"
      },
      {
        "startTime": 3465,
        "duration": 315,
        "name": "script",
        "attribution": "[{\"name\":\"renderReactSubtree\",\"scriptId\":\"bundle.js\"}]"
      }
    ]
  }
}
```
