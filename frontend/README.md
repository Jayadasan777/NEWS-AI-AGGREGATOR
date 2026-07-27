# NewsAI — Frontend Architecture & UI Design System

This directory contains the React frontend for **NewsAI**, an enterprise-grade AI news aggregation, event clustering, and autonomous social distribution platform. The frontend is built for speed, responsiveness, and state-of-the-art visual immersion.

---

## 🚀 Tech Stack & Core Libraries

| Library | Version | Purpose |
| :--- | :--- | :--- |
| **React** | 19.x | Component-based UI rendering |
| **Vite** | 6.x | Extremely fast build tool and HMR dev server |
| **TailwindCSS** | 4.x | Utility-first styling with custom CSS design tokens |
| **Three.js / R3F** | `@react-three/fiber` / `drei` | Immersive 3D scenes, floating monoliths, and interactive heroes |
| **Post-Processing** | `@react-three/postprocessing` | Cyberpunk visual effects (`Bloom`, `Glitch`, `ChromaticAberration`, `Noise`) |
| **Framer Motion** | 12.x | Smooth page transitions, layout animations, and custom mouse cursor |
| **React Router DOM** | 7.x | Client-side routing across 7 core application views |
| **Axios** | 1.x | Configured HTTP client connecting to the Node.js / Express backend |

---

## 🎨 Cosmic Glassmorphism Design System

The visual identity of NewsAI moves away from static, plain editorial cards toward an interactive **Cosmic Glassmorphism & Cyberpunk Terminal** aesthetic:

1. **Cosmic Background & Glow Blobs (`App.jsx` & `GlowBlob.jsx`)**
   - An ambient, animated multi-layered background featuring glowing radial gradients (`blob-1` through `blob-4`) and a subtle CSS noise overlay to give the interface depth and texture.
2. **Custom Interactive Cursor (`CustomCursor.jsx`)**
   - A reactive Framer Motion mouse tracking cursor that scales and responds dynamically to user interactions across interactive elements.
3. **3D Interactive Showcase (`ShowcaseScene.jsx` & `SceneEngine.jsx`)**
   - Built with Three.js / React Three Fiber, featuring:
     - Iridescent double rings with emblem geometry.
     - Floating glass monolith panels with 3D typography (`Text`, `Float`).
     - TorusKnot geometries with controlled glitch bursts.
     - Reflective ground planes (`MeshReflectorMaterial`) and rising ambient particle fields (`Sparkles`).
     - Parallax mouse-tracking camera movement.
4. **Bento Grid & UI Telemetry (`BentoCard.jsx`, `OrbitSignal.jsx`, `SignalMeter.jsx`)**
   - Information displays are styled in modern bento grid layouts with animated signal strength indicators and telemetry telemetry badges.

---

## 🗺️ Application Routing & Page Structure

The application routes are wrapped in smooth Framer Motion page transitions (`AnimatePresence`) and mounted inside `App.jsx`:

| Route | Page Component | Description |
| :--- | :--- | :--- |
| `/` | `Home.jsx` | The main intelligence feed displaying clustered news events, 3D heroes, bento grid statistics, and live automation monitoring. |
| `/sector/:sectorName` | `Sector.jsx` | Dynamic sector-filtered view for any of the 14 monitored sectors (Tech, Finance, Geopolitics, Sports, AI, Crypto, Space, etc.). |
| `/article/:id` | `ArticleDetail.jsx` | Detailed view for a single AI-synthesized article, including original 150-word summary, thumbnail, and social metadata. |
| `/event/:id` | `EventDetail.jsx` | Event-centric intelligence dispatch showing fused summaries, corroborating source articles, and multi-source confidence scores (35%, 65%, 90%+). |
| `/search` | `Search.jsx` | Real-time client and server-side search interface filtering across titles, summaries, and sector tags. |
| `/about` | `About.jsx` | Architecture breakdown explaining the Phase 1–4 evolution, NISE clustering engine, and Groq LPU pipeline. |
| `/studio` | `SocialStudio.jsx` | **Social Studio Command Center**: Manage the autonomous distribution queue, preview Instagram/Twitter cards with interactive toggles, fire manual 14-feed scrapes, toggle autonomous broadcast mode, and execute webhooks. |

---

## 🧠 Centralized State Management (`HUDContext.jsx`)

The `HUDProvider` context wraps the entire application and exposes:
- `activeSector` / `setActiveSector`: Centralized tracking of the currently selected news sector.
- `menuOpen` / `setMenuOpen`: Mobile navigation drawer state.
- `triggerGlitch`: Function to trigger visual glitch feedback across UI components during major actions (e.g., triggering manual scrapes or broadcasting posts).

---

## ⚙️ Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `frontend` root directory if you need to point to a remote backend (defaults to `http://localhost:5000/api`):
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Start Development Server
```bash
npm run dev
```
The frontend dev server will launch at `http://localhost:5173`. Ensure your Node.js backend (`npm run dev` in `/backend`) is running simultaneously on port 5000.
