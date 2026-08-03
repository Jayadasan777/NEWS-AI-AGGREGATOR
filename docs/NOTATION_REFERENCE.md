# IEEE Paper Mathematical Notation & Terminology Reference

*Standardized symbol reference table mapping paper notation to codebase variables.*

---

## 1. Symbol Notation Index

| Symbol | Mathematical Definition | Codebase Variable / Reference | Domain / Range |
| :--- | :--- | :--- | :--- |
| $\mathcal{S}_{\text{key}}$ | Jaccard token set intersection-over-union | `calculateJaccardSimilarity()` | $[0.0, 1.0]$ |
| $\mathcal{S}_{\text{head}}$ | Character 3-gram dense cosine similarity | `calculateSemanticCosineSimilarity()` | $[0.0, 1.0]$ |
| $\mathcal{S}_{\text{ent}}$ | Named entity overlap ratio | `computeEfsaScore().breakdown.S_ent` | $[0.0, 1.0]$ |
| $\mathcal{S}_{\text{temp}}$ | Exponential temporal decay function | $\exp(-\lambda \cdot \Delta t)$ | $(0.0, 1.0]$ |
| $\mathcal{S}_{\text{sec}}$ | Categorical sector matching indicator | `S_sec = (secA === secB ? 1.0 : 0.0)` | $\{0.0, 1.0\}$ |
| $\mathcal{S}_{\text{EFSA}}$ | Five-signal evidence fusion score | `computeEfsaScore().S_EFSA` | $[0.0, 1.0]$ |
| $w_{\text{key}}, w_{\text{head}}, w_{\text{ent}}, w_{\text{temp}}, w_{\text{sec}}$ | EFSA component weights ($\sum w_i = 1.0$) | `0.25, 0.30, 0.25, 0.10, 0.10` | $(0.0, 1.0)$ |
| $\tau_{\text{J}}$ | Production Jaccard gating threshold | `JACCARD_THRESHOLD = 0.12` | $0.12$ |
| $\tau_{\text{C}}$ | Production Cosine gating threshold | `SEMANTIC_COSINE_THRESHOLD = 0.25` | $0.25$ |
| $\tau_{\text{EFSA}}$ | EFSA decision gating threshold | `EFSA_THRESHOLD = 0.22` | $0.22$ |
| $\lambda$ | Temporal decay constant | `lambda = 0.02` ($\text{hours}^{-1}$) | $0.02$ |
| $\Delta t$ | Elapsed hours between publication times | `deltaHours = \|t_A - t_B\| / 3600000` | $[0, \infty)$ |
| $\alpha$ | DPCS Exponential Moving Average weight | `alpha = 0.20` | $0.20$ |
| $C_{\text{pub}}(t)$ | Dynamic Publisher Credibility Score at step $t$ | `updatePublisherCredibility()` | $[0, 100]$ |
| $R_{\text{agree}}$ | Source agreement ratio | $(N_{\text{sup}} + 0.5 N_{\text{neu}}) / N_{\text{tot}}$ | $[0.0, 1.0]$ |
| $\kappa$ | Fleiss' inter-annotator agreement coefficient | `interAnnotatorAgreement.js` | $[-1.0, 1.0]$ |

---

## 2. Terminology Standardization Guide

To ensure consistency throughout the text, the following terms are strictly demarcated:

1. **Gate / Pre-Filter**: Refers exclusively to Stage 1 computational filters (Jaccard, Cosine, EFSA, SBERT) that decide whether to execute an LLM call.
2. **LLM Verifier**: Refers exclusively to Stage 2 LLM inference (`isSameEvent`) via Llama 3 on Groq LPUs.
3. **Multi-Source Fusion**: Refers to the synthesis of multiple verified articles into a single canonical event summary (`fuseSummaries`).
4. **Stance & Divergence Agent**: Refers to the multi-perspective stance classification module (`detectStancesAndDivergence`).
5. **Reflection Agent**: Refers to the self-correcting factuality guardrail (`verifyFactualityAndReflect`).
