# Production Deployment & Infrastructure Guide

This guide outlines deployment requirements, hardware sizing, Docker orchestration, and environment configuration for the multi-stage event clustering pipeline.

---

## 1. Hardware Requirements & Performance Specifications

| Environment Tier | CPU Cores | RAM | Storage | Peak Ingestion Rate | Max Articles in 48h Window |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Minimal / Evaluation** | 2 vCPU | 4 GB | 20 GB SSD | 50 articles/min | 10,000 articles |
| **Recommended Production** | 4 vCPU | 8 GB | 100 GB NVMe | 500 articles/min | 100,000 articles |
| **Enterprise High-Throughput** | 8 vCPU | 16 GB | 500 GB NVMe | 2,500 articles/min | 1,000,000 articles |

### Latency Budget per Ingestion Step
1. **Lexical Gate (Jaccard + 3-gram Cosine)**: < 0.2 ms / pair (CPU)
2. **EFSA 5-Signal Gate**: < 0.5 ms / pair (CPU)
3. **Local SBERT Embedding (all-MiniLM-L6-v2)**: ~ 8.0 ms / pair (CPU ONNX)
4. **Llama 3.1 8B Verification (Groq LPU)**: ~ 250 - 350 ms / call
5. **Multi-Source Fusion (Groq LPU)**: ~ 400 - 600 ms / call

---

## 2. Docker & Container Deployment

### 2.1 Prerequisite Files
Ensure `Dockerfile` and `docker-compose.yml` are present in the repository root.

### 2.2 Docker Compose Quickstart
```bash
# Clone repository
git clone https://github.com/Jayadasan777/NEWS-AI-AGGREGATOR.git
cd NEWS-AI-AGGREGATOR

# Create environment file
cp backend/.env.example backend/.env

# Build and start services
docker-compose up --build -d
```

### 2.3 Container Architecture
- **backend**: Node.js 20 LTS API & ingestion engine worker
- **mongodb**: MongoDB 7.0 database container with indexed compound queries
- **frontend**: Vite React frontend container served via NGINX

---

## 3. Environment Variables Reference

| Variable Name | Required | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `GROQ_API_KEY` | **Yes** | `gsk_...` | Groq LPU API key for Llama 3 models |
| `MONGODB_URI` | **Yes** | `mongodb://localhost:27017/newsai` | MongoDB connection string |
| `PORT` | No | `5000` | Backend API port |
| `AUTO_BROADCAST` | No | `false` | Enable automated social broadcast dispatches |
| `ENABLE_EFSA_GATE` | No | `true` | Enable EFSA multi-signal pre-filtering gate |
| `ENABLE_DPCS_GATE` | No | `false` | Enable experimental DPCS publisher credibility filter |

---

## 4. Scalability Limits & System Safeguards

1. **MongoDB Query Optimization**: The database enforces compound indices on `{ sector: 1, first_reported: -1 }` to restrict event candidate searches strictly within the 48-hour window ($t \ge t_{\text{current}} - 48\text{h}$).
2. **API Throttling & Rate Limits**: Ingestion workers stagger feed processing batches with 15-second sleep buffers every 5 feed calls to adhere to Groq LPU rate limits (30 RPM).
3. **Memory Safeguards**: SBERT vector embeddings use mean pooling ONNX runtime with shared memory buffers to prevent memory leaks during continuous 24/7 ingestion.
