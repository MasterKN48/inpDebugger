# API Overview

The INP Debugger API is built with Elysia and Bun. It provides endpoints for running analyses, retrieving results, and managing history.

## Base URL
The API is typically served at `http://localhost:3000/api` (configurable).

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/analyze` | Start a new INP analysis. |
| `GET` | `/results/:jobId` | Retrieve full results for a job. |
| `GET` | `/progress/:jobId` | (SSE) Live progress of an active job. |
| `GET` | `/history` | List previous analysis runs. |
| `DELETE` | `/history/:runId` | Delete a specific run. |
| `POST` | `/compare` | Compare two analysis runs. |

## Content Types
- Request bodies are `application/json`.
- Responses are `application/json` (except SSE).
