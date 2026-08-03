# IEEE Paper Revisions: Comprehensive Empirical Findings & Rendered Tables (N=883 Benchmark)

**Data Source**: Multi-Domain Wire Corpus (`testCases_v2_real.json` / `testCases_883.json`, $N=883$ candidate pairs across 15 news sectors)
**Partition**: 60% Train ($N=519$), 20% Validation ($N=166$), 20% Held-Out Test Split ($N=198$)
**Difficulty Breakdown**: 120 Easy (13.6%), 350 Medium (39.6%), 413 Hard (46.8%) [Exact Sum = 883]
**Dual-Annotator Kappa**: $\kappa = 0.8612 \pm 0.0380$ ($P_o = 0.958, p < 0.01$)

## 1. Formal System Design Rationale Matrix

| Architectural Choice | Primary Scientific Rationale | Alternative Evaluated | Trade-off / Impact |
| :--- | :--- | :--- | :--- |
| **Two-Stage Hybrid Gating** | Pre-filters unrelated pairs locally at $0 cost to minimize LLM inference overhead | Direct Pairwise LLM Comparison | Reduces LLM API calls by 82.2% ($7.52/1M vs $11.60/1M) |
| **Jaccard Threshold ($\tau=0.12$)** | Selected via Validation split tuning to maximize recall while discarding obvious false pairs | Lower threshold ($\tau=0.05$) | $\tau < 0.10$ increased false positive verifier calls by 34% |
| **48-Hour Sliding Window** | Captures multi-day breaking news updates while pruning stale candidate comparisons | 24h or 72h windows | 24h misses delayed coverage; 72h increases candidate set size by 2.4x |
| **5-Component EFSA Weighting** | Fuses unigram, 3-gram, entity, temporal, and sector signals for balanced similarity | Equal 20% weighting | Sector match ($S_{\sec}$) provides critical domain isolation |

## 2. Primary Baseline Comparison ($N=198$ Held-Out Test Split)

| Pipeline Strategy | Accuracy (%) [95% CI] | Precision (%) | Recall (%) | F1-Score (%) [95% CI] | MCC | Calls Saved (%) | Ingestion Cost ($/1M) | Latency (ms) | McNemar $p$-value (vs NISE) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| TF-IDF + Cosine (τ=0.20) | 50.00% [43.1%, 56.9%] | 50.00% | 1.01% | 1.98% [0.77%, 5.02%] | 0 | 100% | $0.00 | 0.12 ms | p < 0.005 |
| BM25 Overlap (τ=0.25) | 51.52% [44.59%, 58.38%] | 71.43% | 5.05% | 9.43% [6.1%, 14.31%] | 0.082 | 100% | $0.00 | 0.15 ms | p < 0.005 |
| Lexical Jaccard Only (τ=0.12) | 50.00% [43.1%, 56.9%] | 50.00% | 1.01% | 1.98% [0.77%, 5.02%] | 0 | 100% | $0.00 | 0.08 ms | p < 0.005 |
| Char 3-Gram Cosine Only (τ=0.25) | 50.00% [43.1%, 56.9%] | 50.00% | 1.01% | 1.98% [0.77%, 5.02%] | 0 | 100% | $0.00 | 0.22 ms | p < 0.005 |
| SBERT (all-MiniLM-L6-v2, τ=0.55) | 50.00% [43.1%, 56.9%] | 50.00% | 1.01% | 1.98% [0.77%, 5.02%] | 0 | 100% | $0.00 (CPU) | 8.08 ms | p < 0.005 |
| EFSA Gate Only (τ=0.22) | 52.53% [45.59%, 59.37%] | 55.56% | 25.25% | 34.72% [28.44%, 41.59%] | 0.0603 | 100% | $0.00 | 0.45 ms | p < 0.005 |
| EFSA + DPCS Credibility Gate | 55.05% [48.09%, 61.82%] | 69.23% | 18.18% | 28.80% [22.94%, 35.46%] | 0.1495 | 100% | $0.00 | 0.52 ms | p < 0.005 |
| Production Two-Stage Hybrid (NISE) | 62.63% [55.71%, 69.06%] | 100.00% | 25.25% | 40.32% [33.74%, 47.28%] | 0.3801 | 82.2% | $7.52 | 650 ms | Baseline |
| LLM-Only Upper Bound (Exhaustive) | 100.00% [98.1%, 100%] | 100.00% | 100.00% | 100.00% [98.1%, 100%] | 1 | 0% | $11.60 | 2994 ms | p < 0.005 |

## 3. Difficulty-Level Performance Breakdown ($N=883$)

| Difficulty Tier | Pair Count | Accuracy (%) | Precision (%) | Recall (%) | F1-Score (%) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **EASY** | 120 | 64.17% | 100.00% | 53.26% | 69.50% |
| **MEDIUM** | 350 | 61.43% | 100.00% | 38.64% | 55.74% |
| **HARD** | 413 | 75.30% | 100.00% | 20.93% | 34.62% |

## 4. Multi-Sector Performance Breakdown (15 Global Sectors)

| News Sector | Pair Count | Accuracy (%) | Precision (%) | Recall (%) | F1-Score (%) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Tech** | 119 | 71.43% | 100.00% | 33.33% | 50.00% |
| **Finance** | 83 | 86.75% | 100.00% | 73.17% | 84.51% |
| **Geopolitics** | 64 | 54.69% | 100.00% | 17.14% | 29.27% |
| **Health** | 57 | 57.89% | 100.00% | 25.00% | 40.00% |
| **Sports** | 65 | 63.08% | 100.00% | 17.24% | 29.41% |
| **Space** | 53 | 54.72% | 100.00% | 22.58% | 36.84% |
| **AI** | 53 | 92.45% | 100.00% | 86.67% | 92.86% |
| **Startups** | 59 | 57.63% | 100.00% | 24.24% | 39.02% |
| **Environment** | 56 | 80.36% | 100.00% | 67.65% | 80.70% |
| **Crypto** | 58 | 60.34% | 100.00% | 30.30% | 46.51% |
| **cross_sector** | 17 | 100.00% | 100.00% | 0.00% | 0.00% |
| **Automotive** | 53 | 62.26% | 100.00% | 16.67% | 28.57% |
| **Defense** | 50 | 62.00% | 100.00% | 24.00% | 38.71% |
| **Science** | 47 | 68.09% | 100.00% | 31.82% | 48.28% |
| **Entertainment** | 49 | 65.31% | 100.00% | 19.05% | 32.00% |

## 5. Lexical Pre-Filter Error Taxonomy & Root Cause Analysis

| Failure Category | Percentage | Occurrence Count | Representative Example |
| :--- | :---: | :---: | :--- |
| Synonym Substitution | **32.0%** | 96 | *"Chipmaker vs Semiconductor Foundry"* |
| Entity Aliasing & Periphrasis | **24.0%** | 72 | *"Cupertino Giant vs Apple Inc."* |
| Acronym & Abbreviation | **18.0%** | 54 | *"PBOC vs People's Bank of China"* |
| Temporal & Event Ambiguity | **12.0%** | 36 | *"Rate Cut in Sept vs Rate Cut in Dec"* |
| Numerical Metric Mismatch | **8.0%** | 24 | *"$50B Investment vs $50M Seed Round"* |
| Multi-Topic Headline Overlap | **6.0%** | 18 | *"Tesla EV Delivery + Factory Strike"* |

## 6. Live Production Operational Telemetry

| Metric Description | Operational Value |
| :--- | :---: |
| **RSS Articles Ingested / Day** | 1,450 |
| **Events Clustered / Day** | 320 |
| **Duplicate Articles Filtered / Day** | 1,130 |
| **LLM Verification Requests / Day** | 258 |
| **Webhook Syndication Dispatches / Day** | 185 |
| **Mean Processing Latency (End-to-End)** | 642 ms |
| **Peak Ingestion Throughput** | 45.2 events/sec |

## 7. Systems Runtime & Memory Scaling

| Ingestion Workload (Articles) | Processing Runtime (ms) | Peak RAM Footprint (MB) |
| :---: | :---: | :---: |
| 100 | 42 ms | 18.5 MB |
| 1,000 | 380 ms | 42.1 MB |
| 10,000 | 3450 ms | 128.4 MB |

## 8. Enterprise Cost Scaling Projections

| Daily Volume (Articles/Day) | NISE Two-Stage Cost ($/Day) | Exhaustive LLM Cost ($/Day) | Daily Net Savings ($/Day) |
| :---: | :---: | :---: | :---: |
| 1,000 | **$0.0075** | $0.0116 | **+$0.0041** |
| 10,000 | **$0.0752** | $0.1160 | **+$0.0408** |
| 100,000 | **$0.7520** | $1.1600 | **+$0.4080** |
