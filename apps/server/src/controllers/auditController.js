/**
 * ⚡ INP Debugger — Audit Controller
 * Maps REST request payloads, triggers corresponding service-layer actions,
 * manages HTTP header statuses, and formats API payloads.
 */

import * as auditService from "../services/auditService.js";
import { getRunResult } from "../../../../packages/storage/index.js";

/**
 * Initiates an asynchronous background audit.
 * Returns 202 Accepted immediately with the spawned jobId.
 */
export function handleAnalyze({ body, set }) {
  const { url, profile, interactions } = body;
  
  const jobId = auditService.createJob(url, profile, interactions);
  
  set.status = 202; // Asynchronous job accepted for background execution
  return {
    jobId,
    message: "Chromium background measurement audit successfully initiated."
  };
}

/**
 * Returns the live or stored status of a diagnostic audit job.
 */
export function handleGetJobStatus({ params: { jobId }, set }) {
  // 1. Check in-memory active jobs map first
  const activeJob = auditService.getJobStatus(jobId);
  if (activeJob) {
    return activeJob;
  }

  // 2. Fallback: query physical SQLite storage (for cold-reload retrieval)
  const storedResult = getRunResult(jobId);
  if (storedResult) {
    return {
      status: "completed",
      progress: [
        {
          phase: "completed",
          message: "Loaded completed analysis from persistence.",
          timestamp: Date.parse(storedResult.createdAt) || Date.now()
        }
      ],
      result: storedResult,
      error: null
    };
  }

  // 3. Render 404 if job ID doesn't exist
  set.status = 404;
  return {
    error: `Audit diagnostic run with ID "${jobId}" could not be found.`
  };
}

/**
 * Returns list of completed historical runs.
 */
export function handleGetHistory({ query }) {
  return auditService.getHistory(query.url);
}

/**
 * Returns aggregated statistics for a target URL.
 */
export function handleGetAnalytics({ query }) {
  return auditService.getAnalytics(query.url);
}

/**
 * Deletes a historical record or cancels an active running thread.
 */
export function handleDeleteJob({ params: { jobId }, set }) {
  const deleted = auditService.deleteJob(jobId);
  if (deleted) {
    return {
      message: `Audit entry "${jobId}" and any active browser threads aborted/deleted successfully.`
    };
  }

  set.status = 404;
  return {
    error: `Audit entry with ID "${jobId}" not found in storage.`
  };
}
