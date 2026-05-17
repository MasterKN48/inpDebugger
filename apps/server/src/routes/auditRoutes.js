/**
 * ⚡ INP Debugger — API Router
 * Registers REST API endpoints, declares TypeBox schema models for runtime request
 * validation, and links requests to the corresponding Controller handlers.
 */

import { Elysia, t } from "elysia";
import * as auditController from "../controllers/auditController.js";

export const auditRoutes = new Elysia({ prefix: "/api" })
  
  // Asynchronous Audit Trigger Endpoint (Returns 202 Accepted)
  .post("/analyze", auditController.handleAnalyze, {
    body: t.Object({
      url: t.String(),
      profile: t.Optional(t.String()),
      interactions: t.Optional(t.Array(t.Any()))
    })
  })

  // Live progress status monitor / completed result hydration (polling endpoint)
  .get("/results/:jobId", auditController.handleGetJobStatus)

  // Retrieves list of completed audit history
  .get("/history", auditController.handleGetHistory, {
    query: t.Object({
      url: t.Optional(t.String())
    })
  })

  // Aggregated analytical averages for high-traffic paths
  .get("/analytics", auditController.handleGetAnalytics, {
    query: t.Object({
      url: t.String()
    })
  })

  // Cancels active threads or purges completed items from physical storage
  .delete("/results/:jobId", auditController.handleDeleteJob);
