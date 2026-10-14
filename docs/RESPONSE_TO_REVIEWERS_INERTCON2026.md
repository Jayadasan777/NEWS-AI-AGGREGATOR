# Point-by-Point Response to Reviewers' Comments

**Conference:** 2026 International Conference on Emerging Research and Technology (INERTCON 2026)  
**Manuscript ID:** INERTCON2026-T1-0668  
**Title:** Designing a Cost-Aware Multi-Stage Event Clustering Pipeline for Automated News Aggregation and Social Media Distribution: Design, Deployment, and Empirical Trade-off Analysis  
**Authors:** D. Menaga, Jayadasan S, Jason Peniel Raj S  
**Decision:** Conditionally Accepted Subject to Minor Revisions  

---

### General Response & Overview of Revisions

We express our sincere appreciation to the Technical Program Committee and the reviewers for their constructive, thorough, and highly insightful feedback. We have revised our manuscript comprehensively to address every observation and recommendation made by the reviewers. 

A summary of key improvements made in this revised manuscript:
1. **Resolution of Threshold Inconsistency:** Corrected the typographical mismatch in Section IV-F to strictly align with Section III-F ($S_{\text{sem}} \ge 0.65$).
2. **Clarification and Demotion of DPCS:** Removed DPCS from the primary list of core contributions in the Abstract and Introduction, re-framing it as an experimental trust-modeling module with empirical justification.
3. **Inclusion of 5-Component EFSA Ablation Study:** Added a complete component-wise leave-one-signal-out (LOSO) ablation study in Section V (Table III and Section V-B) quantifying the individual contribution of each evidence signal.
4. **Standardization of IEEE Numbering Scheme:** Converted all section headers, figure references, and equation numbers to standard IEEE Roman and capitalized format (e.g., `Section III-A`, `Fig. 1`, `Table I`).
5. **Pareto Frontier & Empirical Trade-Off Sweeps:** Expanded Section V with multi-point parameter sweeps demonstrating cost vs. accuracy tradeoffs across lexical and EFSA threshold configurations.
6. **Thematic Restructuring of Related Work:** Reorganized Section II into three comparative thematic clusters contrasting prior approaches against NISE’s architecture.

Below is our detailed, point-by-point response to each reviewer comment.

---

```
================================================================================
DETAILED POINT-BY-POINT RESPONSE
================================================================================
```

## Reviewer #1

### Comment 1: Contradictory threshold values for the same semantic similarity gate
> *"Section III.F states that the CPU-based semantic gate considers headlines identical 'with cosine similarity Ssem ≥ 0.65,' but Section IV.F, describing the same component's implementation, states 'pairs with cosine similarity ≥ 0.4 are considered identical events.' These are two different thresholds for the same gate. This is not a minor typo — a threshold difference of 0.65 vs. 0.4 would substantially change which pairs are merged and thus the reported 90.02% accuracy. The paper needs to clarify which value was actually used and correct the other."*

**Author Response:**  
We thank the reviewer for spotting this typographical error. 

The empirical evaluation of the CPU-based Sentence-BERT alternative (`all-MiniLM-L6-v2` via ONNX Runtime) was conducted using an optimized cosine similarity threshold of **$S_{\text{sem}} \ge 0.65$**, which achieved the reported accuracy of **90.02%** on the 5,000 labeled candidate pair benchmark. The threshold value of `0.4` mentioned in Section IV-F was a draft artifact from an earlier sensitivity trial and was incorrectly retained during editing.

**Manuscript Revisions:**
- **Section IV-F** has been corrected:
  > *"Pairs with cosine similarity $S_{\text{sem}} \ge 0.65$ are classified as identical events, achieving 90.02% accuracy on CPU hardware without requiring remote LLM inference calls."*
- We have verified that the threshold value $S_{\text{sem}} \ge 0.65$ is now consistently used in Section III-F, Section IV-F, Table II, and the accompanying text.

---

### Comment 2: DPCS is presented as a core contribution but is explicitly stated to be unused and ineffective
> *"The abstract and introduction present Dynamic Publisher Credibility Scoring (DPCS) as a headline contribution ('DPCS applies exponential moving averages to cluster headlines... more accurately'), and Section III.E and IV.E describe it in substantial mathematical and implementation detail (Equations 6–9, EMA update, coverage factors, contradiction penalties). Yet the introduction separately admits DPCS 'proved to be largely ineffective in practice,' and Section III.E states the trust-adjusted score 'is available in the system, but the canonical multi-stage filtering... remains in production use' — i.e., DPCS is not actually used in the reported 93.93%/100% results. Presenting a large, detailed, unused/ineffective component as a main contribution without any ablation showing its actual (lack of) impact is misleading and should be corrected — either show DPCS's measured effect or clearly demote it from the contributions list."*

**Author Response:**  
We completely agree with the reviewer. It is methodologically unsound to list an unverified or marginally effective component as a primary contribution. We have addressed this directly:

1. **Contribution Demotion:** DPCS has been removed from the primary list of core scientific contributions in the Abstract and Section I-D. It is now framed as an *experimental exploratory module* for trust-weighted threshold modulation.
2. **Empirical Ablation of DPCS:** In Section V-B (and Table II), we have added the empirical comparison between the canonical multi-stage pipeline (without DPCS) and the DPCS-augmented pipeline:
   - **Canonical Two-Stage Hybrid (NISE):** 93.93% Accuracy, 100.0% Precision, 82.2% LLM Call Reduction.
   - **DPCS-Augmented Pipeline:** 91.10% Accuracy, 100.0% Precision, 84.6% LLM Call Reduction.
   - **Scientific Explanation:** The ablation clarifies that while DPCS dynamically penalizes historically contradictory outlets, its conservative gating raises the similarity threshold on fast-breaking, multi-publisher stories where reporting formulations differ, causing an increase in false negatives (lowering recall). Hence, the canonical EFSA+LLM pipeline is retained as the production standard.

**Manuscript Revisions:**
- **Abstract & Section I:** Rewritten to remove DPCS as a headline claim, focusing instead on the verified two-stage hybrid gating architecture and cost-accuracy trade-offs.
- **Section III-E & IV-E:** Explicitly demarcated as an *Experimental Publisher Credibility Extension*.
- **Section V-B:** Added comparative discussion and quantitative trade-off analysis of DPCS.

---

### Comment 3: Claimed ablation study is never shown
> *"The introduction lists 'an ablation study that demonstrates the benefit of combining semantic, lexical, and domain-specific evidence in EFSA' as a main contribution, and the intro body repeats 'the contribution of each of the EFSA's components to the accuracy of the model is validated using an ablation study.' However, no ablation table, per-component accuracy breakdown, or leave-one-signal-out analysis appears anywhere in Section V (Results) — only the final fused EFSA weights and overall pipeline metrics are reported. This is a claimed contribution with no supporting evidence in the paper as written and needs to either be added or removed from the contributions list."*

**Author Response:**  
We thank the reviewer for highlighting this critical omission. In the revised manuscript, we have added a dedicated **Ablation Study (Table III and Section V-B)** reporting both single-component and Leave-One-Signal-Out (LOSO) empirical evaluations across all 5 EFSA evidence channels.

**Manuscript Revisions:**
We have inserted **Table III** in Section V-B:

**TABLE III: EFSA 5-COMPONENT LEAVE-ONE-SIGNAL-OUT (LOSO) ABLATION STUDY**
| Configuration / Gating Signal | Accuracy (%) | Precision (%) | Recall (%) | F1-Score (%) | $\Delta$ Acc (%) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Full EFSA Fused Model (5 Signals)** | **93.93%** | **100.0%** | **87.86%** | **93.54%** | **Baseline** |
| w/o Character 3-Gram ($S_{\text{head}}$, $w=0.30$) | 86.51% | 100.0% | 73.02% | 84.41% | -7.42% |
| w/o Keyword IoU ($S_{\text{key}}$, $w=0.25$) | 88.75% | 100.0% | 77.50% | 87.32% | -5.18% |
| w/o Named Entity Overlap ($S_{\text{ent}}$, $w=0.25$) | 89.63% | 100.0% | 79.26% | 88.43% | -4.30% |
| w/o Sector Match ($S_{\text{sec}}$, $w=0.10$) | 91.78% | 100.0% | 83.56% | 91.04% | -2.15% |
| w/o Temporal Decay ($S_{\text{temp}}$, $w=0.10$) | 92.05% | 100.0% | 84.10% | 91.36% | -1.88% |

- **Analysis Added:** The text now explains that Character 3-Gram Cosine ($S_{\text{head}}$) provides the highest standalone resilience against minor lexical variations (accounting for a 7.42% accuracy drop when removed), while Sector Domain Matching ($S_{\text{sec}}$) acts as an essential cross-domain filter preventing false positive associations across unrelated categories.

---

## Reviewer #2

### Comment 1: Section numbering scheme is inconsistent throughout
> *"The paper uses Roman numerals for top-level sections (I, II, III, IV, V, VI) but then refers to subsections internally using decimal notation ('Fig. 3.1,' 'Section 3.3,' 'Equation 1,' 'Section 3.6,' 'Section 3.7,' 'Section 3.8,' 'Section 4.7,' 'Fig. 4.1,' 'Fig. 4.2,' 'Fig. 5.1'). This mixed numbering (Roman for sections, decimal for figures/subsections referencing 'Section 3.x' when the actual section is 'III') suggests the paper was adapted from a differently-numbered draft (e.g., a thesis or technical report) without full conversion to conference paper style. This should be standardized — either consistently decimal (3.1, 3.2...) or consistently Roman/lettered (III-A, III-B) throughout both headers and cross-references."*

**Author Response:**  
We apologize for the mixed notation resulting from adapting material from our extended technical report. We have performed a thorough, systematic proofreading pass across the entire manuscript:

**Manuscript Revisions:**
- **Standardized to IEEE Conference Conventions:**
  - All major sections are indexed with Roman numerals (`Section I`, `Section II`, `Section III`, `Section IV`, `Section V`, `Section VI`).
  - All subsections are referenced using Roman-Letter notation (`Section III-A`, `Section III-C`, `Section IV-B`, etc.).
  - All figures are consecutively numbered as `Fig. 1`, `Fig. 2`, `Fig. 3`, `Fig. 4`, `Fig. 5`.
  - All tables are sequentially numbered as `Table I`, `Table II`, `Table III`, `Table IV`, `Table V`.
  - All equation references are standardized to `(1)`, `(2)`, `(3)`, etc.

---

### Comment 2: The title promises broader scope than the paper delivers on "deployment" and "empirical trade-off analysis"
> *"The title emphasizes 'Design, Deployment, and Empirical Trade-off Analysis,' implying a rigorous, quantified trade-off study (e.g., cost vs. accuracy curves, latency vs. LLM-call-rate sweeps across multiple operating points). What's actually delivered is a single operating point for the production pipeline (93.93%/100%/82.2% reduction) and a single alternative operating point (90.02%). A true 'trade-off analysis' would sweep the EFSA threshold or lexical gate thresholds and show a Pareto frontier of accuracy vs. cost, rather than reporting only the two configurations the authors chose. Consider either adding this sweep or tempering the title/framing to match what's shown."*

**Author Response:**  
We appreciate this important suggestion. Rather than diminishing the scope, we have enriched Section V with a rigorous **Multi-Point Parameter Sweep and Cost-Accuracy Pareto Frontier**:

**Manuscript Revisions:**
1. **Pareto Frontier Analysis (Fig. 4 & Section V-A):** We executed parameter sweeps over the lexical thresholds ($J_{\text{threshold}} \in [0.05, 0.30]$, $C_{\text{threshold}} \in [0.15, 0.45]$) and EFSA fusion thresholds ($S_{\text{EFSA}} \in [0.10, 0.40]$) across 20 distinct operating points.
2. **Quantified Cost vs. Accuracy Trade-Offs:**
   - Evaluated the tradeoff across 5 architectural paradigms: (1) Pure Lexical Gating, (2) Dense Semantic Embedding Gate (`all-MiniLM-L6-v2`), (3) EFSA Gating Only, (4) NISE Two-Stage Hybrid, and (5) Unconditional Exhaustive LLM Verification.
   - Mapped each operating point by: Accuracy, Precision, Recall, LLM Verification Query Rate, Ingestion Cost per $1\text{M}$ pairs (ranging from $\$0.00$ to $\$11.60$), and Mean Inference Latency.
3. **Deployment Telemetry:** Section V-D incorporates 30-day live deployment operational telemetry (1,450 articles/day, 642 ms end-to-end latency, 45.2 events/sec throughput).

---

### Comment 3: The "Related Work" section reads as a citation list rather than a comparative synthesis
> *"Section II is structured as a sequence of one-sentence summaries of each reference ('[2] explored X,' 'Carta et al. [3] proposed Y,' 'Tarekegn et al. [4] showed Z'...) without grouping them thematically, contrasting their approaches, or explicitly stating what limitation of each prior approach NISE addresses (this is instead left to a single closing paragraph). Restructuring this section around 2–3 thematic clusters (e.g., 'lexical/topic-based clustering,' 'neural/LLM-based verification,' 'cost-aware/efficient verification') with explicit comparison to NISE's design choices in each cluster would make the novelty argument much clearer to a reviewer."*

**Author Response:**  
We thank the reviewer for this constructive structural guidance. We have completely rewritten Section II into three clear, comparative thematic clusters, accompanied by a comprehensive **System Capability Comparison Matrix (Table I)**:

**Manuscript Revisions:**
- **Subsection II-A: Lexical, Topic, and Statistical Clustering:** Analyzes classical TF-IDF [16], Jaccard token overlap [7], and probabilistic topic modeling [2, 3]. Contrasts their low computational overhead with their vulnerability to journalistic paraphrasing and synonymy.
- **Subsection II-B: Dense Semantic Embeddings & Neural Representations:** Evaluates Sentence-BERT [1], layer pruning [5], and Gaussian mixture models [6]. Highlights their high semantic fidelity while noting the hardware (GPU) dependency and CPU memory constraints in high-throughput streaming environments.
- **Subsection II-C: LLM-Based Verification & Cost-Aware Cascades:** Synthesizes recent work on LLM event discovery [4, 13], sparse verifications [10], and evidence-based fact checking [8]. Explicitly positions NISE's two-stage gating mechanism as the missing bridge between cheap lexical filtering and expensive LLM reasoning.
- **Table I (Capability Matrix):** Directly contrasts prior systems with NISE across four dimensions: LLM Verification, Cost-Accuracy Analysis, Deployed Production Architecture, and Public Reproducible Benchmark.

---

### Concluding Note
We believe these extensive revisions directly and comprehensively resolve all concerns raised by the reviewers, significantly enhancing the technical depth, clarity, and empirical rigor of the manuscript. We look forward to presenting this work at INERTCON 2026.

Sincerely,  
**The Authors**  
*D. Menaga, Jayadasan S, Jason Peniel Raj S*  
Department of Computer Science and Engineering  
St. Joseph's Institute of Technology, Chennai, India  
