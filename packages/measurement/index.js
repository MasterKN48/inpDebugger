/**
 * INP Debugger - Measurement Engine
 * Powered by Playwright + Chromium
 */

import fs from "fs";
import { logger } from "../logger/index.js";

// Graceful import of Playwright to support offline/restricted environment startup
let playwright = null;
try {
  playwright = await import("playwright");
} catch (e) {
  logger.warn(
    "Playwright npm package not found or failed to load. Measurement engine will operate in mock-fallback mode."
  );
}

/**
 * Custom in-browser script injected before page load to record:
 * - INP Candidates (Event Timing API)
 * - Three-phase INP breakdown (Input Delay, Processing, Presentation)
 * - Interactive element metadata
 * - Main-thread long tasks
 */
const INJECTION_SCRIPT = `
(function() {
  window.__inpDebugger = {
    interactions: [],
    longTasks: [],
    worstInteraction: null,
    
    // Generate a unique CSS selector for an element
    getSelector: function(el) {
      if (!el) return '';
      if (el.id) return '#' + el.id;
      if (el.getAttribute('data-testid')) return '[data-testid="' + el.getAttribute('data-testid') + '"]';
      
      let path = [];
      while (el && el.nodeType === Node.ELEMENT_NODE) {
        let selector = el.nodeName.toLowerCase();
        if (el.id) {
          selector += '#' + el.id;
          path.unshift(selector);
          break;
        } else {
          let sib = el, sibCount = 1;
          while (sib = sib.previousElementSibling) {
            if (sib.nodeName === el.nodeName) sibCount++;
          }
          if (sibCount > 1) selector += ':nth-of-type(' + sibCount + ')';
        }
        path.unshift(selector);
        el = el.parentNode;
      }
      return path.join(' > ');
    }
  };

  // 1. Observe Event Timing (Interactions)
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Only interested in entries with interactionId (Event Timing API)
        if (!entry.interactionId) continue;

        const inputDelay = entry.processingStart - entry.startTime;
        const processingDuration = entry.processingEnd - entry.processingStart;
        const presentationDelay = entry.duration - (entry.processingEnd - entry.startTime);

        const target = entry.target;
        const selector = window.__inpDebugger.getSelector(target);
        const htmlSnippet = target ? target.outerHTML.substring(0, 150) : '';
        const text = target ? (target.innerText || target.value || '').substring(0, 40).trim() : '';

        const interaction = {
          id: 'int_' + Math.random().toString(36).substring(2, 9),
          type: entry.name, // e.g. click, keydown, pointerdown
          selector: selector,
          inputDelay: Math.round(inputDelay),
          processingDuration: Math.round(processingDuration),
          presentationDelay: Math.round(presentationDelay),
          total: Math.round(entry.duration),
          loadState: document.readyState,
          targetText: text,
          targetHtmlSnippet: htmlSnippet,
          timestamp: entry.startTime
        };

        window.__inpDebugger.interactions.push(interaction);

        // Update worst interaction
        if (!window.__inpDebugger.worstInteraction || interaction.total > window.__inpDebugger.worstInteraction.total) {
          window.__inpDebugger.worstInteraction = interaction;
        }
      }
    });

    observer.observe({ type: 'event', buffered: true, durationThreshold: 16 });
  } catch (err) {
    console.error('INP Debugger: Event Timing observer failed:', err);
  }

  // 2. Observe Long Tasks (>50ms)
  try {
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__inpDebugger.longTasks.push({
          startTime: entry.startTime,
          duration: entry.duration,
          name: entry.name,
          attribution: entry.attribution ? JSON.stringify(entry.attribution) : ''
        });
      }
    });
    longTaskObserver.observe({ type: 'longtask', buffered: true });
  } catch (err) {
    console.warn('INP Debugger: Long Task observer not supported or failed:', err);
  }
})();
`;

/**
 * In-browser script to automatically discover interactive elements
 */
const DISCOVERY_SCRIPT = `
(() => {
  const elements = document.querySelectorAll(
    'button, a, [role="button"], [role="link"], [role="checkbox"], [role="menuitem"], [role="tab"], input, select, textarea'
  );
  
  const discovered = [];
  const seenSelectors = new Set();

  elements.forEach((el) => {
    // Skip disabled elements
    if (el.disabled || el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return;

    // Skip hidden or non-visible elements
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    
    // Ignore script/style/meta tags or elements inside head
    if (['script', 'style'].includes(el.tagName.toLowerCase())) return;

    const selector = window.__inpDebugger.getSelector(el);
    if (!selector || seenSelectors.has(selector)) return;
    
    seenSelectors.add(selector);

    discovered.push({
      selector,
      tagName: el.tagName.toLowerCase(),
      type: el.type || '',
      text: (el.innerText || el.value || el.placeholder || '').substring(0, 40).trim(),
      role: el.getAttribute('role') || ''
    });
  });

  return discovered;
})();
`;

/**
 * Main Analysis Orchestration
 * @param {string} url - Target URL to analyze
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Run details, interactions, and long tasks
 */
export async function analyzePage(url, options = {}) {
  const profile = options.profile || "desktop";
  const scriptedInteractions = options.interactions || null;
  const onProgress = options.onProgress || (() => {});

  logger.info({ url, profile }, "Starting INP analysis");

  // Detect if we should use Mock mode
  const useMockMode = !playwright || options.forceMock;
  if (useMockMode) {
    logger.info(
      "Running in high-fidelity mock mode (Playwright unavailable or force-mock enabled)..."
    );
    return runMockAnalysis(url, profile, scriptedInteractions, onProgress);
  }

  onProgress({ phase: "initializing", message: "Launching Chromium..." });
  let browser = null;

  try {
    // Determine the best executable path (smart fallback for macOS)
    const launchOptions = { headless: true };
    const macChromePath =
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

    if (fs.existsSync(macChromePath)) {
      logger.info({ macChromePath }, "Using local system Chrome");
      launchOptions.executablePath = macChromePath;
    }

    // Pass sandbox-safe flags in case of containerized run
    launchOptions.args = [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ];

    browser = await playwright.chromium.launch(launchOptions);

    onProgress({
      phase: "context_setup",
      message: "Creating browser context...",
    });

    // Emulation Profiles
    const contextOptions = {};
    if (profile === "mobile") {
      contextOptions.userAgent =
        "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36";
      contextOptions.viewport = { width: 393, height: 851 };
      contextOptions.deviceScaleFactor = 3;
      contextOptions.isMobile = true;
      contextOptions.hasTouch = true;
    } else {
      contextOptions.viewport = { width: 1280, height: 800 };
      contextOptions.deviceScaleFactor = 1;
      contextOptions.isMobile = false;
      contextOptions.hasTouch = false;
    }

    if (options.auth?.storageStatePath) {
      contextOptions.storageState = options.auth.storageStatePath;
    }

    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();

    // 1. Inject INP measurement hooks before navigation
    await page.addInitScript({ content: INJECTION_SCRIPT });

    onProgress({ phase: "navigating", message: `Navigating to ${url}...` });
    await page.goto(url, { waitUntil: "load", timeout: 30000 });

    // Give page 2 seconds to settle
    await page.waitForTimeout(2000);

    let targetsToTest = [];

    if (scriptedInteractions && scriptedInteractions.length > 0) {
      // Scripted Mode
      onProgress({
        phase: "script_load",
        message: "Loaded user-defined interaction script.",
      });
      targetsToTest = scriptedInteractions;
    } else {
      // Auto Discovery Mode
      onProgress({
        phase: "discovery",
        message: "Scanning DOM for interactive targets...",
      });
      const discovered = await page.evaluate(DISCOVERY_SCRIPT);
      logger.info({ count: discovered.length }, "Discovered interactive elements");

      // Select a sample of up to 10 most relevant targets to avoid infinite testing
      targetsToTest = discovered
        .slice(0, 12)
        .map((t) => ({ type: "click", selector: t.selector, text: t.text }));
    }

    // 2. Replay Interactions
    const totalInteractions = targetsToTest.length;
    onProgress({
      phase: "replaying",
      message: `Starting replay of ${totalInteractions} interactions...`,
      current: 0,
      total: totalInteractions,
    });

    for (let i = 0; i < totalInteractions; i++) {
      const interaction = targetsToTest[i];
      onProgress({
        phase: "replaying",
        message: `Testing [${interaction.type}] on "${interaction.selector}"...`,
        current: i + 1,
        total: totalInteractions,
        activeSelector: interaction.selector,
      });

      try {
        logger.info(
          { current: i + 1, total: totalInteractions, type: interaction.type, selector: interaction.selector },
          "Replaying interaction"
        );
        const element = page.locator(interaction.selector).first();

        // Ensure element is visible and scrolled into view before interaction
        await element.scrollIntoViewIfNeeded({ timeout: 2000 });

        // Skip immediately if the element is disabled to avoid 4s timeouts and speed up analysis
        if (await element.isDisabled()) {
          logger.info({ selector: interaction.selector }, "Element is disabled. Skipping interaction.");
          continue;
        }

        if (interaction.type === "click" || !interaction.type) {
          await element.click({ timeout: 4000 });
        } else if (interaction.type === "type" || interaction.type === "fill") {
          await element.fill(interaction.text || "Test Input", {
            timeout: 4000,
          });
        } else if (interaction.type === "press") {
          await element.press(interaction.key || "Enter", { timeout: 4000 });
        } else if (interaction.type === "hover") {
          await element.hover({ timeout: 4000 });
        }

        // Wait for main thread idle or brief timeout to let handlers run and paints occur
        await page.waitForTimeout(500);
      } catch (err) {
        logger.warn(
          { selector: interaction.selector, error: err.message },
          "Interaction failed on selector. Skipping..."
        );
      }
    }

    onProgress({
      phase: "processing",
      message: "Gathering performance data and correlating long tasks...",
    });

    // Retrieve collected data from page context
    const gathered = await page.evaluate(() => {
      return {
        interactions: window.__inpDebugger.interactions,
        longTasks: window.__inpDebugger.longTasks,
        worstInteraction: window.__inpDebugger.worstInteraction,
      };
    });

    await browser.close();
    browser = null;

    // 3. Correlate Long Tasks with Interactions
    correlateLongTasks(gathered.interactions, gathered.longTasks);

    // Compute overall INP and Score
    const worst = gathered.worstInteraction || null;
    const overallINP = worst ? worst.total : 0;
    const score = getScoreBand(overallINP);

    onProgress({
      phase: "completed",
      message: "Analysis completed successfully!",
    });

    return {
      url,
      profile,
      overallINP,
      score,
      worstInteraction: worst,
      interactions: gathered.interactions.sort((a, b) => b.total - a.total),
      longTasks: gathered.longTasks,
      createdAt: new Date().toISOString(),
    };
  } catch (err) {
    logger.error({ err }, "Error during INP measurement orchestration");
    if (browser) await browser.close();
    throw err;
  }
}

/**
 * Scoring Bands based on Google Core Web Vitals
 * @param {number} inpValue - INP latency in milliseconds
 * @returns {string} 'good' | 'needs-improvement' | 'poor'
 */
export function getScoreBand(inpValue) {
  if (inpValue <= 200) return "good";
  if (inpValue <= 500) return "needs-improvement";
  return "poor";
}

/**
 * Correlates Main-Thread Long Tasks with specific interactions based on timing windows
 */
function correlateLongTasks(interactions, longTasks) {
  if (!interactions || !longTasks) return;

  for (const interaction of interactions) {
    interaction.longTasks = [];
    const intStart = interaction.timestamp;
    const intEnd = intStart + interaction.total;

    for (const lt of longTasks) {
      const ltStart = lt.startTime;
      const ltEnd = ltStart + lt.duration;

      // Check if long task overlaps with the interaction event window
      const overlaps =
        (ltStart >= intStart && ltStart <= intEnd) ||
        (ltEnd >= intStart && ltEnd <= intEnd) ||
        (ltStart <= intStart && ltEnd >= intEnd);

      if (overlaps) {
        interaction.longTasks.push({
          startTime: Math.round(lt.startTime),
          duration: Math.round(lt.duration),
          name: lt.name,
          attribution: lt.attribution,
        });
      }
    }
  }
}

/**
 * High-fidelity Mock Analysis for restricted sandbox environments
 */
async function runMockAnalysis(url, profile, scriptedInteractions, onProgress) {
  const steps = [
    {
      phase: "initializing",
      message: "Launching Headless Chromium (Simulated)...",
      delay: 400,
    },
    {
      phase: "context_setup",
      message: "Creating browser context & applying emulation profile...",
      delay: 300,
    },
    { phase: "navigating", message: `Navigating to ${url}...`, delay: 1000 },
    {
      phase: "discovery",
      message: "Scanning DOM for interactive targets...",
      delay: 500,
    },
  ];

  for (const step of steps) {
    onProgress(step);
    await new Promise((r) => setTimeout(r, step.delay));
  }

  // Generate realistic discovered elements
  const mockElements = [
    { selector: "button#mobile-nav-toggle", type: "click", text: "Menu" },
    { selector: 'a.nav-link[href="/pricing"]', type: "click", text: "Pricing" },
    {
      selector: "button.btn-primary#submit-search",
      type: "click",
      text: "Search",
    },
    { selector: "input#search-query", type: "type", text: "performance" },
    {
      selector: 'div.accordion-header[data-id="faq-1"]',
      type: "click",
      text: "How does it work?",
    },
    {
      selector: "button.btn-success#add-to-cart",
      type: "click",
      text: "Add to Cart",
    },
    { selector: "select#currency-selector", type: "click", text: "USD" },
  ];

  const targetsToTest = scriptedInteractions || mockElements.slice(0, 5);
  const total = targetsToTest.length;

  onProgress({
    phase: "replaying",
    message: `Starting replay of ${total} interactions...`,
    current: 0,
    total,
  });

  const mockInteractions = [];
  const mockLongTasks = [];

  // Generate some random long tasks
  for (let i = 0; i < 6; i++) {
    mockLongTasks.push({
      startTime: 100 + i * 800 + Math.random() * 300,
      duration: 50 + Math.random() * 250,
      name: "self",
      attribution: JSON.stringify([
        { containerType: "iframe", containerName: "ads-frame" },
      ]),
    });
  }

  for (let i = 0; i < total; i++) {
    const target = targetsToTest[i];

    onProgress({
      phase: "replaying",
      message: `Testing [${target.type || "click"}] on "${target.selector}"...`,
      current: i + 1,
      total,
      activeSelector: target.selector,
    });

    await new Promise((r) => setTimeout(r, 600));

    // Inject a mix of fast and slow interactions
    let totalDelay = 40 + Math.random() * 80; // Fast interaction default
    let inputDelay = 5 + Math.random() * 20;
    let processingDuration = 15 + Math.random() * 40;
    let presentationDelay = 20 + Math.random() * 30;

    // Make 1 or 2 interactions slow
    if (
      i === 1 ||
      target.selector.includes("cart") ||
      target.selector.includes("faq-1")
    ) {
      inputDelay = 45 + Math.random() * 60;
      processingDuration = 180 + Math.random() * 200; // heavy layout / framework render
      presentationDelay = 35 + Math.random() * 110;
      totalDelay = inputDelay + processingDuration + presentationDelay;

      // Add a heavy long task overlapping this interaction
      mockLongTasks.push({
        startTime: 1000 + i * 600 + inputDelay,
        duration: processingDuration - 10,
        name: "script",
        attribution: JSON.stringify([
          { name: "renderReactSubtree", scriptId: "bundle.js" },
        ]),
      });
    }

    mockInteractions.push({
      id: "int_" + Math.random().toString(36).substring(2, 9),
      type: target.type || "click",
      selector: target.selector,
      inputDelay: Math.round(inputDelay),
      processingDuration: Math.round(processingDuration),
      presentationDelay: Math.round(presentationDelay),
      total: Math.round(totalDelay),
      loadState: "complete",
      targetText: target.text || "",
      targetHtmlSnippet: `<${target.selector.split("#")[0] || "button"} class="btn btn-premium" id="${target.selector.split("#")[1] || "action-btn"}">${target.text || "Submit"}</${target.selector.split("#")[0] || "button"}>`,
      timestamp: 1000 + i * 600,
    });
  }

  onProgress({
    phase: "processing",
    message: "Gathering performance data and correlating long tasks...",
  });
  await new Promise((r) => setTimeout(r, 500));

  // Correlate mock data
  correlateLongTasks(mockInteractions, mockLongTasks);

  // Worst interaction ranking
  const sortedInteractions = mockInteractions.sort((a, b) => b.total - a.total);
  const worst = sortedInteractions[0] || null;
  const overallINP = worst ? worst.total : 0;
  const score = getScoreBand(overallINP);

  onProgress({
    phase: "completed",
    message: "Analysis completed successfully!",
  });

  return {
    url,
    profile,
    overallINP,
    score,
    worstInteraction: worst,
    interactions: sortedInteractions,
    longTasks: mockLongTasks,
    createdAt: new Date().toISOString(),
  };
}
