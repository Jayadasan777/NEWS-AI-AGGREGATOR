# 🏢 NISE Platform — Enterprise Production Operations Manual
**News Intelligence & Synthesis Engine (NISE) System Documentation**

---

## 🏛️ 1. ARCHITECTURE OVERVIEW

The **NISE Platform** is a publication-grade, autonomous news intelligence system engineered to ingest multi-source RSS wire feeds, eliminate redundant scraping through pre-LLM multi-layer deduplication locks, synthesize original editorial dispatches via Meta Llama 3.1-8B on Groq LPUs, cluster multi-outlet coverage into corroborated event nodes, and automatically syndicate press posts to social media platforms (such as Facebook Page walls via Make.com webhooks).

```
 [ 1. Ingestion Layer ] ──────► 21 RSS Feeds across 14 Sectors + MD5 Anti-Dup Lock
                                (backend/jobs/newsEngine.js, backend/models/Article.js)
            │
            ▼
 [ 2. AI Synthesis Layer ] ──► Groq LPU (Llama 3.1 8B) + Pollinations FLUX Banner Generation
                                (backend/jobs/newsEngine.js)
            │
            ▼
 [ 3. Clustering Engine ]  ──► Stage 1: Jaccard (>=0.12) / Cosine (>=0.25) Pre-Filter
                                Stage 2: Llama 3 isSameEvent() + Evidence Fusion + Stance Divergence
                                (backend/jobs/eventEngine.js, backend/models/Event.js)
            │
            ▼
 [ 4. Social Syndication ] ──► Smart Queue + Webhook Retry + Daily Evergreen Recirculation (0 12 * * *)
                                (backend/utils/socialBroadcast.js, backend/jobs/recirculateEngine.js)
            │
            ▼ (HTTP POST Webhook)
 [ 5. Make.com & Facebook ]──► Cloud Webhook Receiver ──► Facebook Pages API Wall Auto-Posting
            │
            ▼
 [ 6. 3D Web Dashboard ]   ──► React 18 + Three.js 3D Cosmic Globe + Bento News Feed + Studio (/studio)
                                (frontend/src/pages/Home.jsx, frontend/src/pages/SocialStudio.jsx)
```

---

## ⚙️ 2. ENVIRONMENT CONFIGURATION

### Required Environment Variables
| Variable Name | Description | Failure Action |
| :--- | :--- | :--- |
| `MONGO_URI` | MongoDB Atlas / local connection string | **Aborts Startup** |
| `GROQ_API_KEY` | Meta Llama 3.1-8B API key for Groq LPUs | **Aborts Startup** |

### Optional Environment Variables
| Variable Name | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Backend HTTP Express server port |
| `SOCIAL_WEBHOOK_URL` | Unset | Make.com / Zapier / Telegram HTTP POST webhook endpoint |
| `AUTO_BROADCAST` | `false` | Automatic background social syndication toggle (`true` / `false`) |

---

## 📡 3. SECTOR WIRE REGISTRY & INGESTION

NISE monitors **21 wire streams** across **14 sectors**:
`Tech`, `Finance`, `Geopolitics`, `Sports`, `AI`, `Startups`, `Crypto`, `Health`, `Science`, `Entertainment`, `Environment`, `Automotive`, `Defense`, and `Space`.

### Pre-LLM Anti-Duplication Lock:
Before triggering AI calls, incoming items are filtered using a 3-way MongoDB query:
```javascript
MatchCondition = (url === U) || (title_hash === MD5(title)) || (title === T)
```

---

## ⚡ 4. EVENT CLUSTERING ENGINE & HYBRID GATING

* **Stage 1a (Unigram Jaccard IoU):** Threshold $\tau_J = 0.12$ ($12\%$).
* **Stage 1b (Sub-Word 3-Gram Cosine):** Threshold $\tau_C = 0.25$ ($25\%$).
* **Stage 2 (Neural Verification):** Candidates passing Stage 1 advance to Llama 3 (`isSameEvent`) for zero-shot neural confirmation.
* **API Cost Reduction:** Stage 1 pre-filtering reduces LLM call volume by **75.56%** in production.

---

## 🪡 5. EVIDENCE FUSION, STANCE & REFLECTION LOOPS

1. **Corroboration Confidence Metric:**
   $$C(N) = \begin{cases} 35\%, & N = 1 \quad \text{(Single-source unverified)} \\ 65\%, & N = 2 \quad \text{(Dual-source corroborated)} \\ 90\%, & N \ge 3 \quad \text{(Multi-source consensus)} \end{cases}$$
2. **Publisher Divergence Score:**
   $$D = \left( \frac{N_{\text{contradicting}}}{N_{\text{total}}} \right) \times 100\%$$
3. **Iterative Hallucination Guardrail Reflection Loop:** Two-pass audit (`verifyFactualityAndReflect`) verifying zero fabricated stats, unsupported entities, or ungrounded claims.

---

## 📲 6. SOCIAL MEDIA SYNDICATION & WEBHOOKS

* **Automatic Facebook Posting:** Dispatches JSON payloads (`photo_url`, `formatted_post`, `social_hashtags`) via HTTP POST to Make.com, which relays the post directly to your Facebook Page wall.
* **Smart Queue Staggering:** 1-hour offsets between post dispatches prevent rate-limit bans.
* **Self-Healing Webhook Retry:** Retries failed webhook calls up to 3 times at 15-minute intervals.
* **Evergreen Recirculation:** A daily node-cron background job (`0 12 * * *` at 12:00 PM UTC) re-posts top viral news ($C(N) \ge 90\%$) older than 48h with an `"ICYMI: "` prefix.

---

## 🛠️ 7. OPERATIONAL COMMAND REFERENCE

### Development & Server Launch:
```bash
# Start backend server
npm start

# Run developer server with live reload
npm run dev
```

### System Health & Index Synchronization:
```bash
# Execute automated System Doctor diagnostic check
npm run doctor

# Verify and synchronize MongoDB compound indexes
npm run verify-indexes
```

### Testing & Load Benchmarking:
```bash
# Run automated API integration test suite
npm test

# Run high-volume synthetic load benchmark
node backend/jobs/evaluation/benchmarkLoad.js
```

---

## 🔍 8. OBSERVABILITY & HEALTH TELEMETRY API

* `GET /ping`: Lightweight health check for external ping services (returns `OK`).
* `GET /api/health`: System health status, process uptime, memory usage, node version, DB state.
* `GET /api/health/metrics`: Comprehensive telemetry returning accumulated AI token counts, average latency, success/failure ratios, article/event counts, and cache stats.

---

## 🚑 9. TROUBLESHOOTING & INCIDENT RECOVERY

| Symptom | Root Cause | Resolution Procedure |
| :--- | :--- | :--- |
| **Server startup aborts** | Missing `MONGO_URI` or `GROQ_API_KEY` | Run `npm run doctor` to identify missing environment keys in `.env` |
| **Slow query response times** | Unindexed MongoDB queries | Execute `npm run verify-indexes` to build required compound indexes |
| **Malformed LLM outputs** | Occasional LLM formatting issues | Automatic self-healing `repairAndParseJson` utility auto-corrects malformed string structures |
| **Social posts not reaching Facebook** | Invalid `SOCIAL_WEBHOOK_URL` | Inspect Make.com webhook URL configuration in `.env` and verify via `/api/social/test` |

---
*NISE Enterprise Operations Manual — Version 1.0.0*
