# POST /analyze

Start a new INP analysis for a given URL.

## Request

### Body
```json
{
  "url": "string",
  "profile": "mobile" | "desktop",
  "interactions": [
    {
      "type": "click" | "type" | "press",
      "selector": "string",
      "text": "string (optional)",
      "key": "string (optional)"
    }
  ],
  "auth": {
    "storageState": "object (optional)"
  }
}
```

## Response

### 202 Accepted
```json
{
  "jobId": "string"
}
```

### 400 Bad Request
```json
{
  "error": "Invalid URL"
}
```
