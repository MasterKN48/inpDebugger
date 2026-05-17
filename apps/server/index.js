/**
 * ⚡ INP Debugger — High-Performance API Server Entry Point
 * Sets up global CORS lifecycles, registers OpenAPI Swagger middleware,
 * mounts modularized API routers, and initiates database connection pools.
 */

import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { initDb } from "../../packages/storage/index.js";
import { logger } from "../../packages/logger/index.js";
import { auditRoutes } from "./src/routes/auditRoutes.js";

// Initialize SQLite database instance from environment variables
const DB_NAME = process.env.DB_NAME || "inpdebugger.db";
initDb(DB_NAME);

// Spawns core Elysia application
export const app = new Elysia()
  // 1. Basic Web Security Headers & CORS Hooks
  .onRequest(({ set }) => {
    // Basic OWASP Web Security Headers
    set.headers["X-Content-Type-Options"] = "nosniff";
    set.headers["X-Frame-Options"] = "DENY";
    set.headers["Referrer-Policy"] = "no-referrer";
    set.headers["Content-Security-Policy"] = "default-src 'self'";

    // CORS Headers supporting custom Auth Key
    set.headers["Access-Control-Allow-Origin"] = "*";
    set.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
    set.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-API-Key";
  })
  
  // CORS Preflight Endpoint
  .options("*", ({ set }) => {
    set.headers["Access-Control-Allow-Origin"] = "*";
    set.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
    set.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-API-Key";
    set.status = 204;
    return "";
  })

  // 2. Basic API Authentication (Server <-> Client via Shared Token)
  .onBeforeHandle(({ request, set }) => {
    // Bypass auth checks for CORS preflight OPTIONS, Health Status root, and Swagger docs
    const url = new URL(request.url);
    if (
      request.method === "OPTIONS" ||
      url.pathname === "/" ||
      url.pathname.startsWith("/swagger")
    ) {
      return;
    }

    const clientApiKey = request.headers.get("X-API-Key") || request.headers.get("x-api-key");
    const expectedKey = process.env.API_KEY || "inp_debugger_secret_key_2026";

    if (clientApiKey !== expectedKey) {
      set.status = 401;
      return {
        success: false,
        error: "Unauthorized",
        message: "Invalid, expired, or missing X-API-Key authorization header."
      };
    }
  })

  // 3. API Standard JSON Response Formatting Hook
  .mapResponse(({ response, set }) => {
    // If the response is undefined, null, or already strictly formatted, handle cleanly
    if (response === undefined || response === null) {
      return {
        success: true,
        data: null,
        message: "No data payload returned."
      };
    }

    if (typeof response === "object" && ("success" in response || "error" in response)) {
      return response;
    }

    // Client or Server Error states
    if (set.status >= 400) {
      return {
        success: false,
        error: response.error || response,
        message: response.message || "An error occurred while executing the API request."
      };
    }

    // Standardized Success responses
    return {
      success: true,
      data: response,
      message: "Request successfully processed."
    };
  })

  // 4. Global API Exception and Error Handler
  .onError(({ code, error, set }) => {
    logger.error({ code, error: error.message || error }, "Global API Exception caught");

    let status = 500;
    let message = "An internal server error occurred.";

    if (code === "VALIDATION") {
      status = 400;
      message = error.message || "Invalid request payload or query parameters.";
    } else if (code === "NOT_FOUND") {
      status = 404;
      message = error.message || "Requested API endpoint not found.";
    }

    set.status = status;
    return {
      success: false,
      error: code,
      message
    };
  })

  // OpenAPI Swagger Interactive Playground (accessible at /swagger)
  .use(
    swagger({
      documentation: {
        info: {
          title: "⚡ INP Debugger Core API Workspace",
          version: "1.0.0",
          description:
            "Modular microservice facilitating headless chromium-automated audits, event timelines, and Interaction to Next Paint (INP) diagnostics."
        }
      }
    })
  )

  // API Server Health Status
  .get("/", () => ({
    status: "online",
    service: "INP Debugger Core Engine",
    timestamp: new Date().toISOString()
  }))

  // Mount the modular Audit router (handles /api/* endpoints)
  .use(auditRoutes);

// Starts the server if run directly (supported by Bun watch-reloads)
if (import.meta.main) {
  const PORT = parseInt(process.env.PORT || "3000", 10);
  app.listen(PORT);
  logger.info(`🦊 Elysia INP Debugger API is active at http://${app.server?.hostname}:${app.server?.port}`);
  logger.info(`📖 Interactive API Swagger document available at http://${app.server?.hostname}:${app.server?.port}/swagger`);
}
