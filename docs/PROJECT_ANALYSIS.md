# NewsAI: An Autonomous Agentic Multi-Source Intelligence & Automated Distribution System

**Academic Project Analysis & Comprehensive System Architecture Reference**  
*Department of Computer Science & Software Engineering*

---

## Abstract

Modern digital journalism is plagued by informational hyper-fragmentation, widespread copyright vulnerability, and manual social distribution overhead. **NewsAI** (News Intelligence & Synthesis Engine / NISE) is an autonomous, full-stack intelligence platform that ingests raw multi-sector wire feeds from 21 global streams across 14 domains, executes transformative neural summaries via Large Language Models (LLMs on Groq LPUs), extracts native media or synthesizes 35mm photojournalism assets, clusters semantically equivalent reports into corroboration-scored event nodes, and dispatches standardized JSON payloads to configurable webhooks (Make.com, Zapier, n8n, Discord, Telegram) for automated multi-channel social distribution. This document presents a comprehensive, Professor-level academic analysis of the system architecture, mathematical clustering formulas, empirical evaluation benchmarks, folder-by-folder & file-by-file component specifications, and systemic audit resolutions.

---

## 1. Theoretical Foundation & System Objectives

The NewsAI platform addresses four fundamental research challenges in automated web intelligence and NLP:

### 1.1 Informational Fragmentation & Redundancy Reduction
Online news agencies (e.g., Reuters, AP, Bloomberg, BBC, CNBC) simultaneously report on the identical real-world event. This results in extreme redundancy, where consumers encounter dozens of isolated, overlapping articles. NewsAI constructs **Event Intelligence Nodes** by linking semantically equivalent dispatches across distinct publishers, synthesizing a unified multi-source perspective.

### 1.2 Copyright-Safe Transformative AI Synthesis
Direct scraping and republishing of proprietary text content induces copyright infringement risk. NewsAI enforces a **transformative neural rewrite pipeline**. Using Meta's `llama-3.1-8b-instant` on Groq LPUs, raw scraped text snippets are converted into original, objective, 150-word editorial dispatches, eliminating verbatim phrase copying while preserving factual integrity.

### 1.3 Deterministic Corroboration & Verification Scoring
Single-source journalism is prone to unverified claims and publisher bias. NewsAI introduces a quantitative **Corroboration Confidence Metric** ($C(N)$) based on multi-source triangulation:
$$C(N) = \begin{cases} 35\% & \text{if } N = 1 \quad \text{(Single-source, unverified report)} \\ 65\% & \text{if } N = 2 \quad \text{(Dual-source corroborated event)} \\ 90\% & \text{if } N \ge 3 \quad \text{(Multi-source consensus verified)} \end{cases}$$
When $N \ge 2$, an AI Multi-Source Evidence Fusion engine synthesizes a consolidated dispatch highlighting both consensus points and conflicting publisher details.

### 1.4 Autonomous Webhook & Multi-Channel Social Distribution
Social media syndication typically requires manual re-formatting and publishing. NewsAI integrates an autonomous social broadcasting pipeline (`socialBroadcast.js` + `/studio` command center). Llama 3 automatically generates structured social media captions (featuring emoji hooks, key bullet breakdowns, and 10–14 viral hashtags) and dispatches standardized JSON payloads (`event: 'NEW_ARTICLE_BROADCAST'`) to configurable webhooks (Make.com, Zapier, n8n, Discord, Telegram). These webhooks allow operators to automate social media posts across third-party platforms (such as Facebook Pages, Instagram, or messaging channels) without direct API tight-coupling in the core engine codebase.

---

## 2. End-to-End System Data Flow & Architectural Tracing

```
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │ 1. INGESTION TRIGGER (Weekly Cron '0 8 * * 1' / Manual HTTP GET /api/trigger)    │
 └────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │
                                          ▼
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │ 2. MULTI-FEED RSS PARSING (backend/jobs/newsEngine.js)                          │
 │    • Ingests 21 RSS wire feeds across 14 sectors                                │
 │    • Layer 1 Pre-LLM Title Deduplication: Article.findOne({ title: item.title })   │
 └────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │
                                          ▼
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │ 3. MULTI-MODAL LLM SYNTHESIS (synthesizeWithGroq via Llama 3.1-8B-Instant)       │
 │    • 150-word Editorial Summary (Neutral, informative rewrite)                    │
 │    • Social Caption (Emoji hook headline + 2-3 bullet points)                     │
 │    • Viral Hashtag Array (10–14 tags: #NewsAI, #Sector, #Topic)                  │
 │    • 35mm Photojournalism Prompt (Reuters/AP optics style description)           │
 └────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │
                                          ▼
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │ 4. HYBRID IMAGE PIPELINE (extractRssImage & generateAndHostImage)                │
 │    • Primary: Extract native press photo from RSS <enclosure> / <media:content>    │
 │    • Fallback: Pollinations.ai FLUX Realism (&model=flux-realism + 800x800 URL) │
 └────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │
                                          ▼
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │ 5. DATABASE PERSISTENCE (Article.save())                                         │
 │    • Saves document to MongoDB Atlas 'articles' collection                       │
 └────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │
                                          ▼
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │ 6. NISE HYBRID TWO-STAGE EVENT CLUSTERING (backend/jobs/eventEngine.js)         │
 │    • Stage 1 Algorithmic Pre-Filter: Jaccard Unigram Overlap (Threshold τ = 0.12)  │
 │    • Stage 2 LLM Verification: isSameEvent(titleA, titleB) via Llama 3 -> "SAME" │
 │    • Node Linking: Append Article ObjectId to Event.source_articles              │
 │    • Evidence Fusion & Scoring: Calculate C(N) and generate fused_summary        │
 └────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │
                                          ▼
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │ 7. AUTONOMOUS WEBHOOK BROADCASTING (backend/utils/socialBroadcast.js)            │
 │    • Checks global.AUTO_BROADCAST_ENABLED / process.env.AUTO_BROADCAST           │
 │    • Formats standardized JSON payload (event: 'NEW_ARTICLE_BROADCAST')           │
 │    • Dispatches HTTP POST to SOCIAL_WEBHOOK_URL (Make.com / Zapier / Discord)     │
 │    • If SOCIAL_WEBHOOK_URL missing: Social Simulation Mode (Terminal log preview) │
 │    • Updates Article broadcast_status ('broadcasted' / 'failed') & broadcast_time │
 └────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │
                                          ▼
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │ 8. FRONTEND PRESENTATION & STUDIO CONTROL (React 19 + R3F + Framer Motion)       │
 │    • REST API endpoints: GET /api/articles, GET /api/events, GET /api/social/queue  │
 │    • Social Studio (/studio): Live social previews, manual scrape & webhook retry  │
 │    • 3D Cosmic UI: Three.js canvas, postprocessing shaders, Bento Grid telemetry  │
 └──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Algorithmic Mechanics & Mathematical Formulations

### 3.1 Stage 1 Algorithmic Pre-Filter: Jaccard Unigram Token Similarity
To solve the $\mathcal{O}(N)$ computational bottleneck of calling an LLM for every new article against all historical database entries, NewsAI implements an algorithmic **Jaccard Unigram Similarity Filter** ($J(A,B)$).

Given headline token set $A$ and event title token set $B$:
$$J(A, B) = \frac{|A \cap B|}{|A \cup B|}$$

**Preprocessing Procedure:**
1. Text string is converted to lowercase and punctuation is stripped via regex `/[^\w\s]/g`.
2. Text is tokenized by whitespace `\s+`.
3. Short tokens ($\le 2$ characters) and stop-words residing in an 80+ English stop-word set ($\mathcal{S}$) are discarded:
   $$A = \{ w \in \text{Tokens}(\text{Headline}_A) \mid |w| > 2 \land w \notin \mathcal{S} \}$$
4. If $J(A, B) \ge \tau$ (where $\tau = 0.12$), the candidate pair is forwarded to Stage 2 for LLM evaluation. If $J(A, B) < 0.12$, the pair is immediately rejected without incurring API latency or quota consumption.

### 3.2 Stage 2 LLM Neural Event Verification
Pairs satisfying $J(A, B) \ge 0.12$ are evaluated by Llama 3 via `isSameEvent(titleA, titleB)`. The zero-shot prompt instructs the model to differentiate between identical real-world occurrences (e.g., *"US Federal Reserve cuts rates"* vs. *"Jerome Powell announces rate slash"*) and distinct events sharing entities (e.g., *"Alphabet fined by EU"* vs. *"Alphabet reports Q2 earnings"*). The model outputs exclusively `"SAME"` or `"DIFFERENT"`.

---

## 4. Complete Technology Stack Matrix

### 4.1 Backend Module Dependencies (`backend/package.json`)

| Dependency | Version | Primary Application Purpose | Exact Import Location |
| :--- | :--- | :--- | :--- |
| `express` | `^5.2.1` | HTTP web server & REST routing engine | `backend/server.js`, `routes/*.js` |
| `mongoose` | `^9.8.0` | Object Data Modeling (ODM) for MongoDB Atlas | `backend/config/db.js`, `models/*.js` |
| `groq-sdk` | `^1.4.0` | Client SDK for Groq LPU Llama 3 inferencing | `backend/jobs/newsEngine.js`, `eventEngine.js` |
| `rss-parser` | `^3.13.0` | XML/RSS wire feed fetcher & parser | `backend/jobs/newsEngine.js` |
| `node-cron` | `^4.6.0` | Background task scheduler for weekly jobs | `backend/server.js` |
| `axios` | `^1.18.1` | Webhook HTTP dispatcher for automated social media payload distribution | `backend/utils/socialBroadcast.js` |
| `cors` | `^2.8.6` | Cross-Origin Resource Sharing middleware | `backend/server.js` |
| `dotenv` | `^17.4.2` | Environment configuration manager | `backend/server.js`, `jobs/*.js` |
| `@google/generative-ai` | `^0.24.1` | *Dev Dependency* retained for historical Phase 1 test script | `backend/jobs/testEngine.js` |
| `nodemon` | `^3.1.14` | *Dev Dependency* auto-restarting server on edit | `backend/package.json` |

### 4.2 Frontend Module Dependencies (`frontend/package.json`)

| Dependency | Version | Primary Application Purpose | Exact Import Location |
| :--- | :--- | :--- | :--- |
| `react` | `^19.2.7` | UI component construction framework | `frontend/src/**/*.jsx` |
| `react-dom` | `^19.2.7` | DOM renderer for React components | `frontend/src/main.jsx` |
| `react-router-dom` | `^7.18.1` | Client-side routing engine | `frontend/src/App.jsx`, `pages/*.jsx` |
| `@react-three/fiber` | `^9.6.1` | React renderer wrapper for Three.js WebGL | `frontend/src/components/ShowcaseScene.jsx`, `SceneEngine.jsx` |
| `@react-three/drei` | `^10.7.7` | R3F 3D helper utilities (Float, Sparkles, Html) | `frontend/src/components/ShowcaseScene.jsx`, `SceneEngine.jsx` |
| `@react-three/postprocessing` | `^3.0.4` | Shader postprocessing effects (Bloom, Glitch, Noise) | `frontend/src/components/ShowcaseScene.jsx`, `SceneEngine.jsx` |
| `three` | `^0.185.1` | WebGL 3D graphics rendering engine | `frontend/src/components/*.jsx` |
| `framer-motion` | `^12.42.2` | Page transitions, Bento grid layout motion, custom cursor | `frontend/src/App.jsx`, `components/*.jsx` |
| `axios` | `^1.18.1` | API client configured with base URL | `frontend/src/api/axios.js` |
| `tailwindcss` | `^4.3.3` | Utility CSS styling & glassmorphic design framework | `frontend/src/index.css` |
| `@tailwindcss/vite` | `^4.3.3` | Vite compiler plugin for Tailwind v4 | `frontend/vite.config.js` |
| `vite` | `^8.1.1` | Frontend build tool and hot-reload dev server | `frontend/package.json` |
| `vite-plugin-pwa` | `^1.3.0` | Progressive Web App manifest generator | `frontend/vite.config.js` |
| `oxlint` | `^1.71.0` | Fast JavaScript/JSX static analysis linter | `frontend/package.json` |

---

## 5. Exhaustive Folder-by-Folder & File-by-File Deep Analysis

### 5.1 Root Workspace Directory (`/`)
- `README.md`: Master repository documentation reflecting system architecture, setup commands, weekly cron schedule (`0 8 * * 1`), and webhook-based social distribution model.
- `package.json`: Root package manifest defining workspace metadata.
- `.gitignore`: Configures workspace version control exclusion rules.

### 5.2 Backend Core (`/backend`)
- `server.js`: Configures Express app, MongoDB connection, `/ping` health route, asynchronous `/api/trigger` route, and weekly cron schedule (`0 8 * * 1`).
- `package.json`: Backend manifest with updated dependencies (`@google/generative-ai` moved to `devDependencies`; unused `cloudinary` removed).
- `.env`: Holds server secrets (`MONGO_URI`, `GROQ_API_KEY`, `SOCIAL_WEBHOOK_URL`).
- `.gitignore`: Ignores `node_modules`, `.env`, `error-log.txt`, `clustering-output.txt`, and `test-output-image.png`.
- `PROJECT_DOCUMENTATION.md`: Academic documentation detailing system evolution across all phases.

### 5.3 Backend Config (`/backend/config`)
- `db.js`: MongoDB Atlas connection wrapper enforcing IPv4 (`family: 4`) and a 15-second selection timeout.

### 5.4 Backend Models (`/backend/models`)
- `Article.js`: Mongoose schema storing `title`, `unique_summary`, `sector`, `image_url`, `url` (default `''`), `timestamp`, `social_caption`, `social_hashtags`, `broadcast_status`, `broadcast_time`, and `broadcast_error`.
- `Event.js`: Mongoose schema storing `event_title`, `sector`, `source_articles`, `image_url` (default `''`), `fused_summary`, `confidence_score`, `first_reported`, and `last_updated`.

### 5.5 Backend Routes (`/backend/routes`)
- `articleRoutes.js`: REST endpoints for `/stats`, `/`, and `/:id`.
- `eventRoutes.js`: REST endpoints for `/latest`, `/`, and `/:id` with populated `source_articles`.
- `socialRoutes.js`: REST endpoints for `/queue`, `/trigger-scrape`, `/broadcast/:id`, `/toggle-auto`, and `/test`.

### 5.6 Backend Engine & Jobs (`/backend/jobs`)
- `newsEngine.js`: Master engine scraping 21 feeds across 14 sectors, executing Groq Llama 3 synthesis, running native RSS / FLUX Realism image logic, and triggering event clustering.
- `eventEngine.js`: NISE two-stage clustering module ($J(A,B) \ge 0.12$ Jaccard pre-filter + Llama 3 neural verification + evidence fusion).
- `runOnce.js`: CLI entry point for running a single news engine pass.
- `testClustering.js`: Integration test for headline clustering logic.
- `testEngine.js`: Phase 1 legacy test artifact (annotated with legacy header comment).
- `testEventEngine.js`: Verification test running full pipeline and logging event clusters.
- `testHybridImage.js`: Verification script testing RSS photo extraction and FLUX Realism image prompt generation.
- `testImage.js`: Legacy diagnostic script for Gemini Imagen 3 key authorization.

### 5.7 Backend Evaluation Module (`/backend/jobs/evaluation`)
- `runEvaluation.js`: Evaluates `testCases.json` against `isSameEvent()`, exports metrics to `evaluation-results-n45.json`.
- `testCases.json`: 45 ground-truth headline pairs across 12 sectors.
- `evaluation-results.json`: Baseline $N=11$ evaluation export ($90.91\%$ Accuracy, $83.33\%$ Precision, $100.00\%$ Recall, $90.91\%$ F1-Score).
- `evaluation-results-n45.json`: Expanded $N=45$ evaluation export ($97.78\%$ Accuracy, $94.44\%$ Precision, $100.00\%$ Recall, $97.14\%$ F1-Score).

### 5.8 Backend Utilities (`/backend/utils`)
- `socialBroadcast.js`: Webhook dispatcher generating standardized JSON payloads for Make.com/Zapier/Discord automation, featuring Social Simulation Mode.

### 5.9 Frontend Core (`/frontend`, `/frontend/src`)
- `package.json`: Frontend manifest with updated dependencies (unused `gsap` removed).
- `vite.config.js`: Vite configuration for React, Tailwind v4, and PWA plugin.
- `index.html`: Web entry loading editorial Google Fonts.
- `.oxlintrc.json`: Oxlint configuration enforcing React hooks rules.
- `main.jsx`: Mounts `<App />` into the DOM.
- `App.jsx`: Master layout component with `CosmicBackground`, `CustomCursor`, `Navbar`, animated routes, and `Footer`.
- `index.css`: Design system CSS rules, glassmorphic utilities, and radial ambient glow keyframes.

### 5.10 Frontend API, Context & Data (`/frontend/src/api`, `/context`, `/data`)
- `axios.js`: Axios instance pointing to `VITE_API_URL` or `http://localhost:5000/api`.
- `HUDContext.jsx`: React context providing `activeSector`, `menuOpen`, and domain lists.
- `sectors.js`: Single source of truth for 14 sector color tokens and metadata.

### 5.11 Frontend Components (`/frontend/src/components`)
- `ArticleCard.jsx`: Glassmorphic article item card.
- `AutomationStatus.jsx`: Backend automation health widget.
- `BackgroundScene.jsx`: 3D Canvas container tracking mouse motion.
- `BentoCard.jsx`: Bento grid layout with takeaway bullet parser and `onError` image fallback.
- `CustomCursor.jsx`: Lagging dual-ring custom mouse pointer tracking component.
- `EventCard.jsx`: Clustered event node card with `SignalMeter` confidence indicator.
- `Footer.jsx`: Platform footer displaying system telemetry.
- `GlowBlob.jsx`: Radial ambient background glow blob utility.
- `LatestFeed.jsx`: Real-time dispatch ticker stream.
- `Navbar.jsx`: Brand navigation header with sector drawer toggle.
- `OrbitSignal.jsx`: Animated SVG radar scanning indicator.
- `Reveal.jsx`: Scroll-triggered motion reveal wrapper.
- `SceneEngine.jsx`: Three.js WebGL scene controller.
- `SectorBadge.jsx`: Color-coded sector pill tag.
- `ShowcaseScene.jsx`: 3D hero scene with monolith glass panels and postprocessing shaders.
- `SignalMeter.jsx`: Confidence score indicator ($35\%$, $65\%$, $90\%$).
- `StatBadge.jsx`: Telemetry metric badge.
- `Hero3D/Hero3D.jsx` & `Hero3D/Hero3DCanvas.jsx`: 3D TorusKnot hero canvas container.

### 5.12 Frontend Pages (`/frontend/src/pages`)
- `Home.jsx`: Main dashboard integrating 3D hero, event nodes, and Bento grid.
- `Sector.jsx`: Domain-filtered article and event list page.
- `ArticleDetail.jsx`: Article view with `onError` image fallback.
- `EventDetail.jsx`: Event view with fused summary and source article list.
- `Search.jsx`: Client-side search interface.
- `About.jsx`: Architecture methodology page updated to accurately display **Llama 3.1 8B (llama-3.1-8b-instant)**, **Jaccard IoU (0.12)**, and **Weekly Cron Schedule**.
- `SocialStudio.jsx`: Social media command center updated to accurately display **`✓ DISPATCHED:`** timestamps and **`NEWSAI PRESS PHOTO`** badges.

---

## 6. Empirical Evaluation & Performance Benchmarks

To validate the NISE two-stage event matching algorithm, formal benchmarks were executed against both a historical baseline dataset ($N=11$, exported to [`evaluation-results.json`](file:///e:/ai-news-aggregator/backend/jobs/evaluation/evaluation-results.json)) and an expanded real-world headline dataset ($N=45$, exported to [`evaluation-results-n45.json`](file:///e:/ai-news-aggregator/backend/jobs/evaluation/evaluation-results-n45.json)).

### 6.1 Benchmark Metric Comparison ($N=11$ vs. $N=45$)

| Benchmark Dataset | Total Cases | Accuracy ($\frac{TP+TN}{\text{Total}}$) | Precision ($\frac{TP}{TP+FP}$) | Recall ($\frac{TP}{TP+FN}$) | F1-Score ($2 \cdot \frac{P \cdot R}{P + R}$) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Baseline ($N=11$)** | 11 | $90.91\%$ | $83.33\%$ | $100.00\%$ | $90.91\%$ |
| **Expanded ($N=45$)** | **45** | **$97.78\%$** | **$94.44\%$** | **$100.00\%$** | **$97.14\%$** |
| **Improvement ($\Delta$)** | **+34** | **$+6.87\%$** | **$+11.11\%$** | **$0.00\%$** | **$+6.23\%$** |

### 6.2 Confusion Matrix Breakdown ($N=45$)

```
                  PREDICTED SAME    PREDICTED DIFFERENT
EXPECTED SAME          17 (TP)             0 (FN)
EXPECTED DIFFERENT      1 (FP)            27 (TN)
```

- **True Positives ($TP = 17$):** All 17 matching event pairs across Tech, Space, Crypto, Automotive, Defense, Geopolitics, Startups, Health, Entertainment, Environment, Sports, and Finance were correctly identified as `SAME`.
- **True Negatives ($TN = 27$):** 27 out of 28 distinct event pairs were correctly classified as `DIFFERENT`.
- **False Negatives ($FN = 0$):** Achieving $100.00\%$ Recall confirms that **zero true event matches were missed** by Llama 3 across the entire 45-case dataset.

### 6.3 Qualitative Error Analysis
Across all 34 newly added real-world headline pairs (Pairs 12–45), the model achieved a **$100\%$ accuracy rate (34 out of 34 correct predictions)**:
- **Category 1 (12 SAME Pairs):** 100% correctly identified as `SAME`.
- **Category 2 (12 DIFFERENT Pairs - Same Entity):** 100% correctly discriminated as `DIFFERENT` (e.g., Nvidia earnings vs. DOJ investigation; Tesla Robotaxi reveal vs. safety recall; OpenAI Sora release vs. Musk lawsuit).
- **Category 3 (10 DIFFERENT Pairs - Topically Adjacent):** 100% correctly classified as `DIFFERENT` (e.g., US Fed vs. Bank of Japan; Google Gemini vs. Anthropic Claude).

The single False Positive ($FP = 1$) across the 45-pair suite occurred on synthetic Pair #2 (`"Apple stock rises 4% after chip announcement"` vs. `"Apple unveils new AI chip for iPhone 18"`), where the model linked the stock movement directly to the product announcement catalyst.

---

## 7. System Audit & Resolution Log

All historical documentation discrepancies have been fully audited and reconciled across the codebase:

1. **Social Distribution Realignment:** Replaced all claims of direct Facebook Graph API integration with accurate wording describing standardized JSON payload dispatches to configurable webhooks (Make.com, Zapier, n8n, Discord, Telegram). Updated `SocialStudio.jsx` badge text to `✓ DISPATCHED:`.
2. **LLM Model Name Realignment:** Updated `frontend/src/pages/About.jsx` to accurately state **Llama 3.1 8B (llama-3.1-8b-instant)**.
3. **Mongoose Schema Omissions Fixed:** Added `url: { type: String, default: '' }` to `backend/models/Article.js` and `image_url: { type: String, default: '' }` to `backend/models/Event.js`.
4. **Jaccard Threshold Single Source of Truth:** Aligned all references across documentation and `About.jsx` to **0.12** ($12\%$), matching production `backend/jobs/eventEngine.js`.
5. **Cron Schedule Alignment:** Aligned all references across `README.md`, `PROJECT_DOCUMENTATION.md`, `socialRoutes.js`, and `server.js` to the weekly schedule (**`0 8 * * 1`**).
6. **Dependency Optimization:** Removed unused `cloudinary` from `backend/package.json` (and deleted `config/cloudinary.js`), removed unused `gsap` from `frontend/package.json`, and moved `@google/generative-ai` to `devDependencies` in `backend/package.json` with an explanatory legacy comment in `testEngine.js`.
7. **Repository Cleanup:** Deleted `backend/error-log.txt`, `backend/clustering-output.txt`, `backend/test-output-image.png`, and added them to `backend/.gitignore`.
8. **Evaluation Benchmark Expansion ($N=11 \to N=45$):** Expanded `testCases.json` to 45 headline pairs across 12 sectors, generating `evaluation-results-n45.json` demonstrating **$97.78\%$ Accuracy** and **$97.14\%$ F1-Score** while retaining `evaluation-results.json` for paper comparison.
9. **Publication-Grade Distribution Architecture:** Implemented a multi-layer anti-duplication lock, 1-hour staggered drip-feed queueing, dynamic source stance detection, evergreen content recirculation (`recirculateEngine.js`), and self-healing webhook retries.

---

## 8. Publication-Grade Ingestion & Distribution Upgrades

To ensure production-grade robustness and publication-level rigor, five architectural enhancements were integrated into the core backend distribution pipeline:

### 8.1 Multi-Layer Anti-Duplication Lock (`newsEngine.js` & `socialBroadcast.js`)
- **Pre-LLM Deduplication Query:** Queries MongoDB for matching `url` OR `title_hash` (MD5 digest of normalized headline) OR exact `title` BEFORE invoking LLM synthesis or Pollinations image generation.
- **Broadcast Idempotency Guard:** Checks `broadcast_status === 'pending'` in `socialBroadcast.js` before dispatch, preventing duplicate webhook payloads.

### 8.2 Autonomous Smart-Queue & Staggered Drip-Feeding (`socialBroadcast.js`)
- Assigns a `scheduled_broadcast_time` with 1-hour staggered offsets (`Date.now() + i * 3600000`) for batch dispatches during ingestion, preventing social platform rate limits and spam flags.

### 8.3 Dynamic Source Stance Detection in Fusion (`eventEngine.js`)
- Updates `fuseSummaries()` prompt to instruct Meta Llama 3 to analyze source stances and explicitly highlight conflicting publisher details when reports diverge on key event facts.

### 8.4 Evergreen Content Recirculation (`recirculateEngine.js`)
- Identifies high-confidence articles (`confidence_score >= 90`) older than 48 hours that have not been recirculated (`is_recirculated !== true`).
- Re-queues a single instance with an `"ICYMI: "` caption prefix and sets `is_recirculated = true` to guarantee zero duplicate re-queuing.

### 8.5 Webhook Self-Healing & Retry Engine (`socialBroadcast.js`)
- Wraps HTTP webhook dispatches in a try/catch self-healing loop.
- Tracks `retry_count` (up to 3 retries) and records `broadcast_error`.
- Schedules automated re-attempts at 15-minute intervals for transient network failures before marking status as `failed`.

