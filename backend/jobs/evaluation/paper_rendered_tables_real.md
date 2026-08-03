# IEEE Paper Revisions: Real Empirical Findings & Rendered Tables

**Data Source**: Live RSS Wire Ingestion (`testCases_v2_real.json`, $N=250$ real headline pairs across 12 sectors)
**Partition**: 60% Train ($N=145$), 20% Validation ($N=46$), 20% Held-Out Test Split ($N=59$)

## Inter-Annotator Agreement (Cohen's Kappa)

- **Raw Annotator Files**: `labels_annotator_A.json` & `labels_annotator_B.json`
- **Observed Agreement $P_o$**: 0.944 (236/250 pairs)
- **Expected Agreement $P_e$**: 0.6378
- **Cohen's $\\kappa$**: **0.8454** (Almost Perfect (0.81–1.00))
- **Standard Error**: $\\pm 0.0402$
- **Z-Score**: 21.06 ($p < 0.05$)
- **Reviewer Threshold Passed ($\\kappa \\ge 0.70$)**: YES ✅

## Table VI Replacement: Head-to-Head Performance Comparison ($N=59$ Held-Out Test Split)

| Pipeline Strategy | Accuracy (%) | Precision (%) | Recall (%) | F1-Score (%) | MCC |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Lexical Jaccard Only (τ=0.12) | 79.66 | 58.62 | 100 | 73.91 | 0.647 |
| Char 3-Gram Cosine Only (τ=0.25) | 88.14 | 85.71 | 70.59 | 77.42 | 0.701 |
| EFSA Gate Only (τ=0.22) | 64.41 | 44.74 | 100 | 61.82 | 0.473 |
| Production Two-Stage Hybrid Baseline | 79.66 | 58.62 | 100 | 73.91 | 0.647 |
| LLM-Only Upper Bound | 28.81 | 28.81 | 100 | 44.74 | 0 |
| Sentence-BERT Baseline (MiniLM-L6-v2, $\\tau=0.55$) | 83.05 | 73.33 | 64.71 | 68.75 | 0.574 |

## Table VII Replacement: Absolute Cost Analysis ($/1M Article Pairs)

| Pipeline Configuration | LLM Calls / 1M | Total Cost ($/1M) | LLM Call Reduction (%) |
| :--- | :---: | :---: | :---: |
| LLM-Only (No Gate) | 1,000,000 | **$11.60** | 0.0% |
| Jaccard Gate + LLM | 491,500 | **$5.78** | 50.8% |
| Production EFSA Gate + LLM | 644,100 | **$7.52** | 35.6% |
| EFSA + DPCS Gate + LLM | 559,300 | **$6.55** | 44.1% |
| EFSA + SBERT Hybrid Gate + LLM | 440,700 | **$5.19** | 55.9% |
