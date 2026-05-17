import { Database } from "bun:sqlite";
import { logger } from "../../../../packages/logger/index.js";
import {
  saveRunResult,
  getHistoryList,
  getAnalyticsOverview,
  deleteRun
} from "../../../../packages/storage/index.js";

// Spawns isolated high-performance in-memory SQLite database for job state tracking
const memDb = new Database(":memory:");

// Initialize relational schema for transient active job and progress states
memDb.run(`
  CREATE TABLE IF NOT EXISTS active_jobs (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    result TEXT,
    error TEXT,
    created_at INTEGER NOT NULL
  )
`);

memDb.run(`
  CREATE TABLE IF NOT EXISTS active_job_progress (
    job_id TEXT NOT NULL,
    phase TEXT NOT NULL,
    message TEXT NOT NULL,
    current INTEGER,
    total INTEGER,
    active_selector TEXT,
    timestamp INTEGER NOT NULL
  )
`);

// Pre-compile all in-memory database statements at startup to prevent native async cache panics
const insertJobStmt = memDb.prepare(`
  INSERT INTO active_jobs (id, status, created_at)
  VALUES (?, 'pending', ?)
`);

const insertProgressStmt = memDb.prepare(`
  INSERT INTO active_job_progress (job_id, phase, message, current, total, active_selector, timestamp)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const updateJobStatusStmt = memDb.prepare(`
  UPDATE active_jobs SET status = ? WHERE id = ?
`);

const updateJobCompleteStmt = memDb.prepare(`
  UPDATE active_jobs SET status = 'completed', result = ? WHERE id = ?
`);

const updateJobFailedStmt = memDb.prepare(`
  UPDATE active_jobs SET status = 'failed', error = ? WHERE id = ?
`);

const selectJobStmt = memDb.prepare(`
  SELECT * FROM active_jobs WHERE id = ?
`);

const selectProgressStmt = memDb.prepare(`
  SELECT * FROM active_job_progress WHERE job_id = ? ORDER BY timestamp ASC
`);

const deleteJobStmt = memDb.prepare(`
  DELETE FROM active_jobs WHERE id = ?
`);

const deleteJobProgressStmt = memDb.prepare(`
  DELETE FROM active_job_progress WHERE job_id = ?
`);

// In-memory reference to active thread Workers (live OS thread handles, non-serializable)
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
  const now = Date.now();
  
  // Persist initial job record in our memory-relational tables
  insertJobStmt.run(jobId, now);
  insertProgressStmt.run(jobId, 'initialized', 'Job queue registered.', null, null, null, now);

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
        updateJobStatusStmt.run('running', jobId);

        const currentVal = progress.current !== undefined && progress.current !== null ? progress.current : null;
        const totalVal = progress.total !== undefined && progress.total !== null ? progress.total : null;
        const phaseVal = progress.phase || 'running';
        const msgVal = progress.message || '';
        const selVal = progress.activeSelector || null;

        insertProgressStmt.run(
          jobId,
          phaseVal,
          msgVal,
          currentVal,
          totalVal,
          selVal,
          Date.now()
        );

        logger.debug({ jobId, phase: phaseVal }, msgVal);
      } 
      
      else if (type === "completed") {
        logger.info({ jobId }, "Background analysis completed successfully. Persisting to database...");
        
        // Add final ID to payload safely
        const finalResult = result || {};
        finalResult.id = jobId;

        try {
          saveRunResult(finalResult);
        } catch (saveErr) {
          logger.error({ jobId, err: saveErr.message || saveErr }, "Failed to write results to persistent SQLite database");
        }

        const resultStr = finalResult ? JSON.stringify(finalResult) : null;
        updateJobCompleteStmt.run(resultStr, jobId);
        insertProgressStmt.run(jobId, 'completed', 'Analysis saved successfully.', null, null, null, Date.now());

        // Clean up thread resources
        cleanupWorker(jobId);
      } 
      
      else if (type === "error") {
        const errorMsg = error || 'Unknown worker thread error';
        logger.error({ jobId, error: errorMsg }, "Background worker thread error during execution");
        
        updateJobFailedStmt.run(errorMsg, jobId);
        insertProgressStmt.run(jobId, 'failed', `Execution failed: ${errorMsg}`, null, null, null, Date.now());

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
    const catchMsg = err.message || String(err);
    logger.error({ jobId, err: catchMsg }, "Failed to spawn background worker thread");
    
    updateJobFailedStmt.run(`Thread spawning failed: ${catchMsg}`, jobId);
    insertProgressStmt.run(jobId, 'failed', `Thread spawning failed: ${catchMsg}`, null, null, null, Date.now());

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
  const job = selectJobStmt.get(jobId);
  if (!job) return null;

  const progressRows = selectProgressStmt.all(jobId);

  return {
    status: job.status,
    progress: progressRows.map(row => ({
      phase: row.phase,
      message: row.message,
      current: row.current,
      total: row.total,
      activeSelector: row.active_selector,
      timestamp: row.timestamp
    })),
    result: job.result ? JSON.parse(job.result) : null,
    error: job.error
  };
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
    setTimeout(() => {
      try {
        worker.terminate();
      } catch (err) {
        logger.error({ jobId, err: err.message || err }, "Error during worker abort");
      }
    }, 0);
    activeWorkers.delete(jobId);
  }

  // 2. Clear transient records from SQLite in-memory tables
  deleteJobStmt.run(jobId);
  deleteJobProgressStmt.run(jobId);

  // 3. Atomically remove from physical SQLite database
  return deleteRun(jobId);
}

/**
 * Cleans up worker thread reference after termination.
 * @param {string} jobId 
 */
function cleanupWorker(jobId) {
  const worker = activeWorkers.get(jobId);
  if (worker) {
    // Terminate worker asynchronously after 100ms to allow all internal tasks to settle, 
    // ensuring clean OS-level thread release and memory reclamation.
    setTimeout(() => {
      try {
        worker.terminate();
      } catch (err) {
        logger.error({ jobId, err: err.message || err }, "Error during deferred worker termination");
      }
    }, 100);
    activeWorkers.delete(jobId);
  }
}
