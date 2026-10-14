# Comprehensive Point-by-Point Response to Reviewers' Comments

**Manuscript Title:** Designing a Cost-Aware Multi-Stage Event Clustering Pipeline for Automated News Aggregation and Social Media Distribution: Design, Deployment, and Empirical Trade-off Analysis  
**Authors:** D. Menaga, Jayadasan S, Jason Peniel Raj S  
**Institution:** Department of Computer Science and Engineering, St. Joseph's Institute of Technology, Chennai, India  

---

## Executive Summary of Manuscript Enhancements

We express our sincere gratitude to the Reviewers, Area Chairs, and Technical Program Committees across INERTCON 2026, ICECONF 2026, and ICCDS 2026. Their detailed and rigorous feedback has allowed us to substantially elevate the technical depth, empirical rigor, and presentation quality of this manuscript. 

### Key Technical Revisions & Additions:
1. **Resolution of Semantic Threshold Contradiction:** Aligned the Sentence-BERT semantic gate cosine threshold strictly to $S_{\text{sem}} \ge 0.65$ across all sections, tables, and implementation descriptions, eliminating the draft typo ($0.40$).
2. **Re-framing and Empirical Ablation of DPCS:** Demoted DPCS from primary contribution claims to an experimental trust-modulation module, including empirical comparison explaining its impact on recall.
3. **Inclusion of the Complete 5-Component EFSA Ablation Table:** Added Table III reporting Leave-One-Signal-Out (LOSO) empirical results with McNemar's statistical significance tests ($p < 0.001$).
4. **Comprehensive Benchmark Construction & Annotation Protocol:** Documented the 5,000 labeled headline-pair benchmark (2,500 positive pairs, 1,250 hard negative pairs, 1,250 soft negative pairs, Cohen's $\kappa = 0.884$, 60/20/20 train/val/test split).
5. **Parameter Sensitivity & Optimization Sweeps:** Added empirical grid-search justification for the lexical thresholds ($J=0.12, C=0.25$), EFSA threshold ($S_{\text{EFSA}}=0.22$), and fusion weights $[0.25, 0.30, 0.25, 0.10, 0.10]$.
6. **Multi-Paradigm Comparative Baseline Table:** Benchmarked Pure Jaccard, Pure 3-Gram, Standalone EFSA, CPU Sentence-BERT, NISE Hybrid, and Exhaustive LLM across Accuracy, Precision, Recall, F1, Saved Calls, Cost per 1M pairs, and Latency.
7. **Strict IEEE Formatting & Notation Standardization:** Standardized all section references (`Section III-A`), figures (`Fig. 1`), equations (`(1)`), and restructured Related Work into three comparative thematic clusters.

---

## Detailed Responses to Technical Reviewer Comments

### 1. Semantic Similarity Threshold Consistency
**Reviewer Comment:** *Section III-F states that the CPU-based semantic gate considers headlines identical with cosine similarity $S_{\text{sem}} \ge 0.65$, but Section IV-F states $S_{\text{sem}} \ge 0.40$. This inconsistency substantially affects reported metrics.*  
**Response:** We have resolved this typographical discrepancy. The actual empirical evaluation and production deployment use $S_{\text{sem}} \ge 0.65$, which achieves 90.02% accuracy with 94.30% precision on the 5,000-pair benchmark. Section IV-F, Section III-F, Table II, and Section V-D have been strictly unified to $S_{\text{sem}} \ge 0.65$.

### 2. Role and Claim of Dynamic Publisher Credibility Scoring (DPCS)
**Reviewer Comment:** *DPCS is presented as a headline contribution, yet the text states it was largely ineffective in practice and unused in the 93.93% results.*  
**Response:** We agree with the critique. DPCS has been removed from the primary contribution lists in the Abstract and Section I-D. It is now presented in Section III-G and Section V-B as an exploratory trust-modeling extension. In Table II, we show that while DPCS saves slightly more LLM calls (84.6% vs 82.2%), its conservative penalty increases false negatives on fast-breaking multi-source stories, dropping accuracy from 93.93% to 91.10%. Hence, the canonical EFSA+LLM pipeline is retained as the standard.

### 3. EFSA Component Ablation Study
**Reviewer Comment:** *The paper claims an ablation study validating EFSA components, but no ablation table appears in Section V.*  
**Response:** We have included **Table III** in Section V-C showing full Leave-One-Signal-Out (LOSO) results:
- Full EFSA Model: 93.93% Accuracy (Baseline)
- w/o Character 3-Gram ($S_{\text{head}}$): 86.51% (-7.42%)
- w/o Keyword IoU ($S_{\text{key}}$): 88.75% (-5.18%)
- w/o Named Entity ($S_{\text{ent}}$): 89.63% (-4.30%)
- w/o Sector Match ($S_{\text{sec}}$): 91.78% (-2.15%)
- w/o Temporal Decay ($S_{\text{temp}}$): 92.05% (-1.88%)
McNemar's statistical significance tests confirm all 5 evidence channels contribute significantly to overall accuracy ($p < 0.001$).

### 4. Benchmark Construction & Annotation Rigor
**Reviewer Comment:** *The construction of the 5,000 labeled headline-pair benchmark requires further description, including data sources, positive/negative pair generation, annotation procedure, class balance, and split.*  
**Response:** Section V-A now explicitly details:
- **Sources:** 18 live RSS wire feeds spanning 14 sectors over a continuous 48-hour window.
- **Balance:** 2,500 positive pairs and 2,500 negative pairs (1,250 hard negatives sharing entities but describing distinct events, 1,250 cross-sector distractors).
- **Annotation:** Dual-blind annotation by two NLP researchers achieving Cohen's $\kappa = 0.884$, with tie-breaking adjudication by a third senior researcher.
- **Splits:** 60% train (3,000 pairs), 20% validation (1,000 pairs), 20% test (1,000 pairs).

### 5. Parameter Sensitivity & Threshold Justification
**Reviewer Comment:** *The selection of Jaccard threshold (0.12), character 3-gram cosine threshold (0.25), EFSA threshold (0.22), and fusion weights must be justified through empirical analysis.*  
**Response:** Section V-D details validation grid sweeps:
- $(J=0.12, C=0.25)$ eliminates 78.4% of dissimilars while preserving 98.6% candidate recall.
- $S_{\text{EFSA}} = 0.22$ maximizes candidate recall (87.86%) while dispatching only 17.80% of pairs to LLM verification.
- $S_{\text{sem}} = 0.65$ maximizes F1 (89.46%) with 94.30% precision; lower thresholds ($0.40$) drop precision to 62.10%.

### 6. Section Numbering & IEEE Formatting
**Reviewer Comment:** *Mixed decimal and Roman notation throughout the manuscript.*  
**Response:** All section headers, internal cross-references (`Section III-A`, `Section V-B`), figures (`Fig. 1`), and equations (`(1)`) are now formatted in strict IEEE compliance.
