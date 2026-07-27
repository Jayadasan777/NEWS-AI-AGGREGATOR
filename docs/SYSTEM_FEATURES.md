# NewsAI System Feature Catalog

**Comprehensive Architectural & Functional Feature Reference**  
*News Intelligence & Synthesis Engine (NISE) Platform*

---

## 🌟 Executive Feature Summary

NewsAI is a publication-grade, full-stack autonomous news intelligence platform. The following catalog presents an exhaustive enumeration of all features engineered across the system architecture.

---

## 1. 📡 Multi-Source Wire Feed Ingestion & Pre-Filtering

- **14 Multi-Domain News Sectors:** Ingests intelligence across `Tech`, `Finance`, `Geopolitics`, `Sports`, `AI`, `Startups`, `Crypto`, `Health`, `Science`, `Entertainment`, `Environment`, `Automotive`, `Defense`, and `Space`.
- **21 Global Wire Streams:** Aggregates feeds from top-tier global agencies including Reuters, AP, Bloomberg, BBC News, CNBC, Al Jazeera, TechCrunch, The Verge, and Nature.
- **Strict Multi-Layer Anti-Duplication Lock:** Query-level pre-filtering in `newsEngine.js` checking MongoDB for matching `url` OR `title_hash` (MD5 digest of normalized headline) OR exact `title` BEFORE invoking LLM synthesis or Pollinations image generation. Eliminates redundant API latency and duplicate database entries.

---

## 2. 🧠 Multi-Modal Neural AI Synthesis (Groq LPUs)

- **Transformative Copyright-Safe Rewrites:** Uses Meta's open-weight `llama-3.1-8b-instant` on Groq LPU hardware to rewrite raw scraped text into original, objective 150-word editorial dispatches, eliminating verbatim phrase copying.
- **Automated Social Content Generation:** Automatically generates Instagram/Facebook/Twitter hook captions, key takeaway bullet points, and an array of 10–14 viral hashtags (`#NewsAI #BreakingNews #Sector`).
- **35mm Photojournalism Prompt Synthesis:** Generates high-fidelity camera optics prompts describing scenes in Reuters/AP news photography style (35mm lens, f/2.8, natural lighting).

---

## 3. 🖼️ Hybrid Photojournalism & Image Generation Pipeline

- **Native RSS Press Photo Extraction (`extractRssImage`):** Parses RSS feeds for real press photographs embedded in `<enclosure>`, `<media:content>`, or HTML `<img>` tags.
- **Pollinations FLUX Realism Fallback:** Dynamically generates prompt-encoded 800x800 square thumbnail URLs using `pollinations.ai` with `&model=flux-realism` for keyless image generation.
- **Client-Side Image Delegation:** Bypasses server-side bot protection by storing prompt-encoded URLs in MongoDB and delegating image fetching directly to the user's web browser.
- **Fail-Safe UI Image Handlers:** Integrated inline `onError` image handlers across all UI cards and detail pages pointing to high-resolution news photo fallbacks.

---

## 4. 🔗 NISE Hybrid Two-Stage Event Clustering Engine

- **Stage 1a Algorithmic Pre-Filter (Jaccard IoU):** Computes unigram keyword overlap ($J(A,B) = \frac{|A \cap B|}{|A \cup B|}$) after stop-word removal. Threshold $\tau = 0.12$ ($12\%$) eliminates $>80\%$ of non-matching candidate comparisons.
- **Stage 1b Sub-Word 3-Gram Cosine Similarity:** Computes sub-word 3-gram TF-IDF vector cosine similarity ($\tau = 0.25$) to catch synonym-rich headline pairs (e.g. *"Congress clears legislation"* vs. *"House passes bill"*) that share zero unigram tokens.
- **Stage 2 LLM Neural Verification:** Pairs passing Stage 1 advance to Llama 3 via `isSameEvent()`, which outputs a deterministic `"SAME"` or `"DIFFERENT"` judgment based on underlying incident identity.
- **Deterministic Corroboration Scoring ($C(N)$):**
  - **1 Source (35%):** Single-source unverified report.
  - **2 Sources (65%):** Corroborated event report.
  - **3+ Sources (90%+):** High-confidence consensus verified event.

---

## 5. ⚖️ Multi-Source Evidence Fusion & Stance Analysis

- **Multi-Source Summary Synthesis:** Blends reports from contributing outlets into a single consolidated executive brief when $N \ge 2$.
- **Dynamic Source Stance Detection Agent (`detectStancesAndDivergence`):** Classifies each publisher's reporting stance as `Supporting`, `Contradicting`, or `Neutral`, and computes a quantitative **Divergence Score** (0–100%) reflecting publisher disagreement.
- **Hallucination Guardrail Reflection Loop (`verifyFactualityAndReflect`):** Cross-references LLM-generated summaries against raw source text snippets. If fabricated numbers or ungrounded claims are detected, triggers self-correcting re-generation.
- **Visual Stance Telemetry:** UI component `<StanceBreakdown.jsx/>` displays stance distribution pills, color-coded framing labels, and a `✓ SUMMARY VERIFIED` trust badge.

---

## 6. 🚀 Autonomous Smart-Queue & Social Webhook Broadcasting

- **Universal Dual-Structure JSON Payload:** Sends standardized JSON dispatches containing both flat top-level properties (`message`, `photo_url`, `link`, `title`, `summary`, `caption`) and nested `article` objects for universal field mapping.
- **Autonomous Smart-Queue Staggered Drip-Feeding:** Assigns 1-hour staggered `scheduled_broadcast_time` offsets (`Date.now() + i * 3600000`) to batch dispatches during ingestion, preventing social platform rate limits and spam flags.
- **Webhook Self-Healing & Retry Logic:** Wraps dispatches in a try/catch loop tracking `retry_count` (up to 3 retries) and scheduling 15-minute automated re-attempts before marking as `failed`.
- **Broadcast Idempotency Guard:** Verifies `broadcast_status === 'pending'` in `socialBroadcast.js` before dispatching to guarantee zero duplicate posts.
- **Social Simulation Mode:** Gracefully simulates social broadcasts and logs terminal caption previews when `SOCIAL_WEBHOOK_URL` is omitted.

---

## 7. ♻️ Evergreen Content Recirculation Engine (`recirculateEngine.js`)

- **High-Confidence Selection:** Scans MongoDB for articles created $>48$ hours ago linked to high-confidence events (`confidence_score >= 90`).
- **Single-Instance ICYMI Re-Queuing:** Applies an `"ICYMI: "` (In Case You Missed It) caption prefix, sets `is_recirculated = true`, and re-queues a single instance via the drip queue to prevent spamming.

---

## 8. 📱 Interactive Social Studio Command Center (`/studio`)

- **Interactive 3D iPhone 15 Pro Preview:** Real-time mobile device rendering showing live social post appearance, like counters, expanded captions, and hashtag pills.
- **Live Dispatch Queue Management:** Filter queue by status (`All`, `Pending`, `Broadcasted`), view dispatch timestamps (`✓ DISPATCHED:`), and monitor failure logs.
- **Manual Broadcast & Test Overrides:** One-click manual trigger (`🚀 BROADCAST TO FACEBOOK NOW`) with `{ force: true }` parameter, plus an instant test webhook button (`GET /api/social/test`).
- **Autonomous Robot Mode Toggle:** Real-time toggle (`/api/social/toggle-auto`) for switching between manual approval and 24/7 automated broadcasting.
- **Manual 14-Feed Ingestion Trigger:** Trigger an immediate news scrape across all 14 sectors directly from the dashboard (`/api/social/trigger-scrape`).

---

## 9. 🎨 3D Cosmic Glassmorphism UI & Design System

- **Three.js WebGL 3D Hero Scenes (`ShowcaseScene.jsx`, `SceneEngine.jsx`):** Floating glass monolith panels, iridescent double rings, TorusKnots with glitch bursts, reflective ground planes (`MeshReflectorMaterial`), and mouse parallax camera tracking.
- **Post-Processing Shaders:** Advanced visual effects pipeline featuring `Bloom`, `Glitch` (with controlled glitch modes), `ChromaticAberration`, and `Noise`.
- **Cosmic Component System:**
  - `BentoCard.jsx`: Bento-grid modular layout cards with strategic takeaway parsers.
  - `CustomCursor.jsx`: Dual-ring lagging Framer Motion custom mouse cursor tracking.
  - `OrbitSignal.jsx` & `SignalMeter.jsx`: Radar scanning animation and confidence score indicators.
  - `EventTimeline.jsx`: Chronological story evolution timeline tracking dispatches from first report to latest update.
  - `HUDContext.jsx`: Centralized UI state managing active sectors, glitch triggers, and mobile drawer state.

---

## 10. 📊 Empirical Evaluation Benchmark Suite ($N=45$)

- **Formal Evaluation Dataset (`testCases.json`):** 45 labeled real-world wire headline pairs across 12 news domains (16 `SAME`, 29 `DIFFERENT`).
- **Benchmark Performance Metrics (`evaluation-results-n45.json`):**
  - **Accuracy:** **$97.78\%$** (44 out of 45 correct predictions)
  - **Precision:** **$94.44\%$**
  - **Recall:** **$100.00\%$** (Zero true event matches missed)
  - **F1-Score:** **$97.14\%$**
- **Dual Benchmark Persistence:** Maintains both baseline ($N=11$, `evaluation-results.json`) and expanded ($N=45$, `evaluation-results-n45.json`) benchmark outputs for before/after paper comparison.

---

## 11. ⚡ Production Reliability & Cloud Infrastructure

- **Keep-Alive Health Endpoint (`GET /ping`):** Prevents cloud host server hibernation (Render, Railway, Heroku) when pinged by external monitors (`cron-job.org`, UptimeRobot).
- **Asynchronous Ingestion Endpoint (`GET /api/trigger`):** Launches background news scrapes while immediately returning a 200 OK JSON response, eliminating HTTP gateway timeouts.
- **Optimized Weekly Cron (`0 8 * * 1`):** Automatically runs full 14-feed scrapes every Monday at 08:00 UTC, conserving Groq LPU quotas and image generation bandwidth.
