# GET /results/:jobId

Retrieve the full results of an INP analysis.

## Parameters
- `jobId`: The unique ID returned by `/analyze`.

## Response

### 200 OK
```json
{
  "jobId": "string",
  "url": "string",
  "profile": "mobile" | "desktop",
  "overallINP": number,
  "score": "good" | "needs-improvement" | "poor",
  "worstInteraction": {
    "selector": "string",
    "type": "string",
    "inputDelay": number,
    "processingDuration": number,
    "presentationDelay": number,
    "total": number
  },
  "interactions": [
    {
      "selector": "string",
      "type": "string",
      "total": number,
      "phases": {
        "inputDelay": number,
        "processingDuration": number,
        "presentationDelay": number
      }
    }
  ],
  "createdAt": "iso-date"
}
```

### 404 Not Found
```json
{
  "error": "Job not found"
}
```
