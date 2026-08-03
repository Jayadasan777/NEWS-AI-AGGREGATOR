# NewsAI Engine REST API Specification

This document provides the complete API schema for the autonomous multi-stage event clustering, ingestion, and social broadcast system.

---

## Base URL & Environment

- **Development Base URL**: `http://localhost:5000/api`
- **Production Base URL**: `https://api.newsai.internal/v1`
- **Format**: JSON (`Content-Type: application/json`)

---

## 1. Events API

### 1.1 List Clustered Events
Retrieves aggregated event clusters sorted by report timestamp.

- **Endpoint**: `GET /events`
- **Query Parameters**:
  - `sector` *(string, optional)*: Filter by sector (e.g., `Tech`, `Finance`, `Geopolitics`).
  - `page` *(number, optional)*: Page number for pagination (default: 1).
  - `limit` *(number, optional)*: Items per page (default: 20).

**Response Body (200 OK)**:
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "66ac18f2e4b01a2b3c4d5e6f",
      "event_title": "Federal Reserve Cuts Benchmark Interest Rates by 50 Basis Points",
      "sector": "Finance",
      "canonical_summary": "The Federal Reserve initiated monetary easing with a 50 basis point rate reduction...",
      "confidence_score": 90,
      "divergence_score": 15,
      "articles": [
        "66ac18f2e4b01a2b3c4d5e10",
        "66ac18f2e4b01a2b3c4d5e11"
      ],
      "stance_analysis": [
        {
          "publisher": "Reuters",
          "stance": "Supporting",
          "framing": "economic policy",
          "rationale": "Focuses on inflation targets and employment mandate."
        },
        {
          "publisher": "Financial Times",
          "stance": "Neutral",
          "framing": "market reaction",
          "rationale": "Highlights bond market yield changes."
        }
      ],
      "first_reported": "2026-08-01T14:30:00.000Z",
      "last_updated": "2026-08-01T16:15:00.000Z"
    }
  ]
}
```

### 1.2 Get Single Event Details
Retrieves full event cluster including all constituent article metadata and stance analysis.

- **Endpoint**: `GET /events/:id`

---

## 2. Ingestion & Pipeline Engine API

### 2.1 Trigger RSS Ingestion Engine
Triggers full multi-source RSS feed fetch across 14 sector feeds, executes EFSA gating, LLM verification, multi-source fusion, and automated stance classification.

- **Endpoint**: `POST /news/trigger-engine`

**Response Body (200 OK)**:
```json
{
  "message": "Autonomous News Engine Execution Finished Successfully!"
}
```

---

## 3. Social Media Broadcast API

### 3.1 Broadcast Article / Event Dispatch
Dispatches an aggregated dispatch with synthesized Instagram caption, viral hashtags, and FLUX realism photojournalism prompt to connected broadcast channels.

- **Endpoint**: `POST /social/broadcast`
- **Request Body**:
```json
{
  "article_id": "66ac18f2e4b01a2b3c4d5e10"
}
```

**Response Body (200 OK)**:
```json
{
  "success": true,
  "broadcast_status": "published",
  "dispatch_timestamp": "2026-08-02T12:00:00.000Z"
}
```

---

## 4. System Telemetry & Evaluation API

### 4.1 Evaluation Telemetry Summary
Retrieves LPU latency, Groq API success/failure rate, and gate pass percentages.

- **Endpoint**: `GET /telemetry/ai-summary`

**Response Body (200 OK)**:
```json
{
  "success": true,
  "telemetry": {
    "total_calls": 1420,
    "success_rate": 99.4,
    "mean_latency_ms": 342,
    "model": "llama-3.1-8b-instant"
  }
}
```
