/**
 * ⚡ INP Debugger — Background Measurement Thread (Worker)
 * Executes headless Chromium automation (or simulation fallback) off the main thread.
 */

import { analyzePage } from "../../../../packages/measurement/index.js";

// Listen for analysis trigger messages from the parent thread
self.onmessage = async (event) => {
  const { jobId, url, profile, interactions } = event.data;

  try {
    const result = await analyzePage(url, {
      profile,
      interactions,
      onProgress: (p) => {
        // Post real-time progress update messages back to the main thread
        self.postMessage({
          type: "progress",
          jobId,
          progress: p
        });
      }
    });

    // Post final completed results
    self.postMessage({
      type: "completed",
      jobId,
      result
    });
  } catch (err) {
    // Post error details back
    self.postMessage({
      type: "error",
      jobId,
      error: err.stack || err.message || String(err)
    });
  }
};
