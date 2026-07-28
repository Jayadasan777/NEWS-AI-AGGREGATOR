# NewsAI — Autonomous AI News Aggregation & Social Distribution Engine

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue?style=for-the-badge&logo=mongodb)](https://mongodb.com)
[![AI Engine](https://img.shields.io/badge/AI-Meta%20Llama%203%20via%20Groq-orange?style=for-the-badge&logo=meta)](https://groq.com)
[![Image Gen](https://img.shields.io/badge/Images-Pollinations.ai-purple?style=for-the-badge)](https://pollinations.ai)
[![Frontend](https://img.shields.io/badge/UI-Three.js%20%2B%20R3F-green?style=for-the-badge&logo=react)](https://threejs.org)

**NewsAI** is an enterprise-grade autonomous intelligence platform that ingests live news feeds from 14 global sectors, synthesizes transformative 150-word editorial summaries using Meta Llama 3 (via Groq LPUs), generates contextual square thumbnails via Pollinations.ai, clusters duplicate coverage into corroborated events with confidence scoring, and dispatches standardized JSON payloads to configurable webhooks (Make.com, Zapier, n8n, Discord, Telegram) for automated multi-channel social distribution.

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Ingestion["1. Multi-Source RSS Ingestion Layer"]
        RSS["21 RSS Feeds & Live Search Queries<br/>(Tech, Finance, Geopolitics, AI, Crypto, Space, etc.)"]
        Dedup["Pre-LLM Deduplication Filter<br/>(MongoDB Title Check)"]
        RSS --> Dedup
    end

    subgraph Processing["2. AI Processing Engine (Groq LPU / Llama 3.1-8B)"]
        Synth["Multi-Modal AI Synthesis<br/>• 150-word Editorial Summary<br/>• Instagram/Twitter Hook Caption<br/>• 10-14 Viral Hashtags"]
        ImgGen["Dynamic Image Generation<br/>(Pollinations.ai 800x800 Square URL)"]
        Dedup --> Synth
        Synth --> ImgGen
    end

    subgraph Intelligence["3. NISE Event Intelligence & Clustering Layer"]
        Jaccard["Stage 1: Algorithmic Pre-Filter<br/>(Jaccard Unigram Similarity >= 12%)"]
        LLMMatch["Stage 2: Llama 3 Verification<br/>(SAME vs DIFFERENT Token Judgment)"]
        Fusion["Evidence Fusion & Scoring<br/>(35% / 65% / 90% Corroboration Confidence)"]
        ImgGen --> Jaccard
        Jaccard -->|Candidate Found| LLMMatch
        LLMMatch -->|SAME Event| Fusion
    end

    subgraph Database["4. MongoDB Atlas Database"]
        ArtColl[("Articles Collection")]
        EvtColl[("Events Collection")]
        ImgGen --> ArtColl
        Fusion --> EvtColl
    end

    subgraph Distribution["5. Autonomous Distribution & Presentation"]
        AutoBroadcast["Autonomous Webhook Engine<br/>(Make.com / Zapier / Telegram / Discord)"]
        SocialStudio["Social Studio Command Center<br/>(Interactive React/Vite UI at /studio)"]
        CosmicUI["3D Cosmic Glassmorphism UI<br/>(Three.js / R3F / Framer Motion)"]
        EvtColl --> AutoBroadcast
        ArtColl --> SocialStudio
        EvtColl --> CosmicUI
    end
```

---

## 🌟 Key Features & Evolution (Phases 1–4)

### 📌 Phase 1: Core MERN Pipeline & AI Transformation
- **Transformative Rewriting:** Designed to reduce copyright exposure through transformative rewriting (a legally unsettled area, not a guaranteed exemption) by using LLMs to synthesize raw scraped news snippets into original 150-word editorial dispatches.
- **Keyless Image Generation:** Utilizes URL-based prompt encoding via `pollinations.ai` to dynamically generate contextual thumbnail artwork without managing complex third-party image API keys.
- **RESTful Architecture:** Express API server backed by MongoDB Atlas with full CORS support and clean JSON response structures.

### 📌 Phase 2: NISE (News Intelligence & Synthesis Engine)
- **Event-Centric Clustering:** Replaces isolated article lists with clustered news events. Automatically links multiple articles reporting on the same real-world event into a single entity.
- **Corroboration Confidence Scoring:** Transparent, auditable rule-based scoring:
  - **1 Source:** 35% (Single-source unverified report)
  - **2 Sources:** 65% (Corroborated by independent outlets)
  - **3+ Sources:** 90%+ (High-confidence verified event)
- **Multi-Source Fusion:** Blends summaries from contributing outlets while explicitly noting source disagreements.

### 📌 Phase 3: Enterprise Scale & NLP Pipeline Upgrades
- **Llama 3 on Groq LPUs:** Migrated from proprietary Gemini endpoints to Meta's open-weight `llama-3.1-8b-instant` on Groq, unlocking near-instant inference speeds and bypassing restrictive daily quotas.
- **Hybrid Two-Stage Clustering:** Solves $\mathcal{O}(N)$ scaling bottlenecks by running a local algorithmic **Jaccard similarity filter** ($J(A,B) = \frac{|A \cap B|}{|A \cup B|}$) before invoking AI. Llama 3 is only called if unigram similarity is $\ge 12\%$, cutting API overhead by $>80\%$.
- **Client-Side Image Delegation:** Bypasses server-side Cloudflare bot protection by storing prompt-encoded URLs in MongoDB and delegating image fetching directly to the end-user's web browser.

### 📌 Phase 4: The Distribution Layer & 3D Cosmic UI
- **14 Multi-Source Feed Registry:** Sourcing intelligence across 21 top-tier streams in 14 sectors: `Tech`, `Finance`, `Geopolitics`, `Sports`, `AI`, `Startups`, `Crypto`, `Health`, `Science`, `Entertainment`, `Environment`, `Automotive`, `Defense`, and `Space`.
- **Groq Social Engine:** Every synthesized article automatically generates an Instagram/Twitter-optimized caption (with catchy emoji hooks and bullet points) and an array of 10–14 viral hashtags.
- **Autonomous Social Webhook Broadcasting:** Real-time webhook integration (`utils/socialBroadcast.js`) connecting to Make.com, Zapier, n8n, Discord, or Telegram. Includes an **Intelligent Social Simulation Mode** for local environments without webhook URLs.
- **Social Studio (`/studio`):** An interactive frontend dashboard for monitoring the distribution queue, previewing social posts with interactive like toggles, firing manual 14-feed scrapes (`/api/social/trigger-scrape`), toggling autonomous mode (`/api/social/toggle-auto`), and testing webhooks.
- **3D Cosmic Glassmorphism UI:** Powered by `@react-three/fiber`, `@react-three/drei`, and `@react-three/postprocessing`, featuring floating monolith glass panels, iridescent rings, TorusKnots with glitch bursts, custom Framer Motion cursor tracking, and bento-grid telemetry widgets.
- **Cloud Monitoring Support:** Includes a keep-alive endpoint (`GET /ping`) for external uptime monitors (`cron-job.org`, UptimeRobot) to prevent server sleep on free-tier cloud hosts.

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB Atlas account (or local MongoDB instance)
- Groq API Key (Free tier available at [console.groq.com](https://console.groq.com))

### 1. Backend Setup
Navigate to the `backend` directory, install dependencies, and configure environment variables:

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://your_username:your_password@host1:port,host2:port/your_db?ssl=true&replicaSet=your_replica_set&authSource=admin
GROQ_API_KEY=gsk_your_groq_api_key_here
AUTO_BROADCAST=false
# Optional: Set a webhook URL for Make.com / Zapier / n8n / Discord / Telegram broadcasting
SOCIAL_WEBHOOK_URL=https://hook.us1.make.com/your_webhook_id
```

Start the backend server:
```bash
# For development with nodemon:
npm run dev

# Or standard Node execution:
npm start
```
The server will start on `http://localhost:5000` and schedule automated 14-feed AI scrapes weekly on Monday at 08:00 UTC (`0 8 * * 1`).

---

### 2. Frontend Setup
Open a new terminal instance, navigate to the `frontend` directory, install dependencies, and launch Vite:

```bash
cd frontend
npm install
npm run dev
```
The frontend dev server will launch at `http://localhost:5173`. Open this URL in your web browser to experience NewsAI.

---

## 🔌 API Endpoints Reference

### Core News & Event Endpoints
- `GET /ping` — Lightweight keep-alive ping for external monitors (`cron-job.org`).
- `GET /api/trigger` — Asynchronously trigger an immediate 14-feed AI news scrape in the background.
- `GET /api/articles` — Retrieve all articles (Supports `?sector=Tech` filtering).
- `GET /api/articles/:id` — Retrieve a single article by MongoDB ID.
- `GET /api/events` — Retrieve clustered news events (sorted by latest activity).
- `GET /api/events/:id` — Retrieve a single event with full corroborated source article details.

### Social Studio & Distribution Endpoints (`/api/social`)
- `GET /api/social/queue` — Retrieve social broadcasting queue (Supports `?status=pending|broadcasted|all` & `?limit=20`).
- `POST /api/social/trigger-scrape` — Trigger an immediate AI news scrape directly from the Social Studio UI.
- `POST /api/social/broadcast/:id` — Manually dispatch a specific article to the configured social webhook.
- `POST /api/social/toggle-auto` — Toggle autonomous social broadcasting mode on/off in real-time (`{ "enabled": true/false }`).
- `GET /api/social/test` — Instantly test webhook integration by broadcasting the latest saved article in MongoDB.

---

## 📚 Documentation Directory
- **[Academic Research Paper & Analysis](file:///e:/ai-news-aggregator/docs/PROJECT_ANALYSIS.md):** Comprehensive 500+ line academic paper draft detailing theoretical foundations, data flow diagrams, Jaccard IoU & Cosine formulas, technology stack matrices, $N=45$ empirical benchmark results (**97.78% Accuracy, 100% Recall**), and system audit logs.
- **[System Feature Catalog](file:///e:/ai-news-aggregator/docs/SYSTEM_FEATURES.md):** Complete catalog enumerating all 11 core feature suites across multi-source RSS ingestion, Llama 3 synthesis, FLUX photojournalism, NISE two-stage clustering, stance detection, social webhooks, 3D Cosmic UI, and cloud monitoring.
- **[Backend & System Architecture Documentation](file:///e:/ai-news-aggregator/backend/PROJECT_DOCUMENTATION.md):** In-depth technical breakdown of all 4 development phases, algorithmic formulas, challenges encountered, prompt engineering iterations, and evaluation results.
- **[Frontend Architecture Guide](file:///e:/ai-news-aggregator/frontend/README.md):** Detailed guide on the Three.js / React Three Fiber setup, Cosmic Glassmorphism design system, component hierarchy, and routing.

---

## 📜 License
This project is developed for research and educational purposes, demonstrating advanced agentic content pipelines, multi-source LLM clustering, and autonomous distribution architectures.
