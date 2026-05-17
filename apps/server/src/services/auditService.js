/**
 * ⚡ INP Debugger — Audit Service
 * Orchestrates business logic, database transactions, in-memory job status tracking,
 * and background thread worker lifecycles.
 */

import { logger } from "../../../../packages/logger/index.js";
import {
  saveRunResult,
  getHistoryList,
  getAnalyticsOverview,
  deleteRun
} from "../../../../packages/storage/index.js";

// In-memory active job status tracker for live progress updates
const activeJobs = new Map();

// In-memory reference to active thread Workers (for termination/aborts)
const activeWorkers = new Map();

/**
 * Creates and initiates a background audit run inside a separate worker thread.
 * @param {string} url - Target URL to analyze
 * @param {string} profile - Emulation profile (desktop | mobile)
 * @param {Array} interactions - Optional user-defined interaction script
 * @returns {string} Unique jobId
 */
export function createJob(url, profile, interactions) {
  const jobId = "job_" + Math.random().toString(36).substring(2, 11);
  
  const jobState = {
    status: "pending",
    progress: [],
    result: null,
    error: null
  };

  activeJobs.set(jobId, jobState);
  logger.info({ jobId, url }, "Initiating background audit job");

  try {
    // Spawns standard background Web Worker thread using Bun's native ESM Worker support
    const workerPath = new URL("../workers/auditWorker.js", import.meta.url).href;
    const worker = new Worker(workerPath, { type: "module" });

    // Track active worker instance for lifecycle control / cancellation
    activeWorkers.set(jobId, worker);

    // Register thread message event loop handler
    worker.onmessage = (event) => {
      const { type, progress, result, error } = event.data;

      if (type === "progress") {
        jobState.status = "running";
        jobState.progress.push({
          phase: progress.phase,
          message: progress.message,
          current: progress.current,
          total: progress.total,
          activeSelector: progress.activeSelector,
          timestamp: Date.now()
        });
        logger.debug({ jobId, phase: progress.phase }, progress.message);
      } 
      
      else if (type === "completed") {
        logger.info({ jobId }, "Background analysis completed successfully. Persisting to database...");
        
        // Add final ID to payload
        result.id = jobId;
        saveRunResult(result);

        jobState.status = "completed";
        jobState.result = result;
        jobState.progress.push({
          phase: "completed",
          message: "Analysis saved successfully.",
          timestamp: Date.now()
        });

        // Clean up thread resources
        cleanupWorker(jobId);
      } 
      
      else if (type === "error") {
        logger.error({ jobId, error }, "Background worker thread error during execution");
        
        jobState.status = "failed";
        jobState.error = error;
        jobState.progress.push({
          phase: "failed",
          message: `Execution failed: ${error}`,
          timestamp: Date.now()
        });

        cleanupWorker(jobId);
      }
    };

    // Trigger execution by sending options to the worker thread
    worker.postMessage({
      jobId,
      url,
      profile,
      interactions
    });

  } catch (err) {
    logger.error({ jobId, err }, "Failed to spawn background worker thread");
    jobState.status = "failed";
    jobState.error = `Thread spawning failed: ${err.message}`;
    jobState.progress.push({
      phase: "failed",
      message: jobState.error,
      timestamp: Date.now()
    });
    cleanupWorker(jobId);
  }

  return jobId;
}

/**
 * Retrieves the live status of an active or recently completed background job.
 * @param {string} jobId - The target jobId
 * @returns {Object|null}
 */
export function getJobStatus(jobId) {
  return activeJobs.get(jobId) || null;
}

/**
 * Retrieves historical audit list from SQLite.
 * @param {string} [urlFilter] - Optional URL search pattern
 * @returns {Array}
 */
export function getHistory(urlFilter) {
  return getHistoryList(urlFilter);
}

/**
 * Computes aggregated metric metrics for an audit target.
 * @param {string} url - Target URL to search
 * @returns {Object}
 */
export function getAnalytics(url) {
  return getAnalyticsOverview(url);
}

/**
 * Deletes completed history audit and aborts any active thread worker.
 * @param {string} jobId - Target jobId
 * @returns {boolean} True if successfully deleted, false otherwise
 */
export function deleteJob(jobId) {
  logger.warn({ jobId }, "Received delete/cancel request for audit job");

  // 1. Immediately abort running thread worker to free CPU/Chrome resources
  const worker = activeWorkers.get(jobId);
  if (worker) {
    logger.info({ jobId }, "Aborting active worker thread...");
    worker.terminate();
    activeWorkers.delete(jobId);
  }

  // 2. Clear in-memory active states
  activeJobs.delete(jobId);

  // 3. Atomically remove from SQLite database
  return deleteRun(jobId);
}

/**
 * Cleans up worker thread reference after termination.
 * @param {string} jobId 
 */
function cleanupWorker(jobId) {
  const worker = activeWorkers.get(jobId);
  if (worker) {
    worker.terminate(); // Double guard termination
    activeWorkers.delete(jobId);
  }
}
