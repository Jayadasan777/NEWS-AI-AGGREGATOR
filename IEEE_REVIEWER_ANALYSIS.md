# IEEE Conference Reviewer Analysis: NISE Paper Critical Assessment

**Reviewer**: Senior IEEE Conference PC Member (NLP/LLM Systems Track)  
**Date**: August 4, 2026  
**Paper**: "Designing a Cost-Aware Multi-Stage Event Clustering Pipeline for Automated News Aggregation"  
**Recommendation**: MAJOR REVISION REQUIRED

---

## EXECUTIVE SUMMARY

The paper presents NISE, a production news aggregation system combining lexical pre-filtering (Jaccard/n-gram), multi-evidence fusion (EFSA), publisher credibility scoring (DPCS), and LLM verification. While the engineering effort is substantial and the system is deployed, the paper suffers from **critical methodological flaws**, **novelty positioning issues**, and **experimental result inconsistencies** that prevent acceptance at a top-tier venue in its current form.

**VERDICT**: The paper is not ready for publication without major revisions addressing foundational issues in evaluation methodology, novelty claims, and experimental transparency.

---

## I. CRITICAL ISSUES (Block Acceptance)

### 1.1 Catastrophic Evaluation Results on N=198 Held-Out Test Set

**ISSUE**: The comprehensive results file (`comprehensive-results_real.json`) reveals **devastating baseline performance**:

- **Jaccard baseline**: 1.01% recall (detected 1 of 99 SAME pairs)
- **3-Gram Cosine baseline**: 1.01% recall (detected 1 of 99 SAME pairs)  
- **Production Two-Stage Hybrid**: 1.01% recall (detected 1 of 99 SAME pairs)
- **EFSA Gate-Only**: 10.1% recall (detected 10 of 99 SAME pairs)

**BUT THE PAPER CLAIMS** (LaTeX line 466):
> "The production two-stage hybrid baseline achieves 62.63% accuracy (95% Wilson CI: [55.71%, 69.06%]), **100.0% precision**, and **40.32% F1-score** (MCC = 0.3801)"

**ANALYSIS**: These numbers come from different datasets:
- Table VI (LaTeX): Based on N=45 test cases (older dataset)
- `comprehensive-results_real.json`: Based on N=198 held-out test split (current dataset)
- SBERT results show 81.82% accuracy on N=198

**CRITICAL PROBLEM**: The paper **presents outdated N=45 results as if they represent the N=198 held-out test performance**, creating a fundamental misrepresentation of system effectiveness. A 1% recall baseline is unusable in production.

**Why This Happened**: The dataset expansion from N=45 to N=883 introduced harder cases (46.8% Hard pairs involving aliases, metonymy, acronyms) that completely broke the lexical baselines. The paper's narrative was not updated to reflect this.

---

### 1.2 Dataset Size Confusion Creates Reproducibility Crisis

**PAPER CLAIMS THREE DIFFERENT DATASET SIZES**:

1. **Abstract (line 86)**: "883-pair multi-domain benchmark (N=883)"
2. **Abstract (line 87)**: "N=519 Train, N=166 Validation, N=198 held-out Test"
3. **Section 5.3 Ablation (line 483, Table VIII)**: "N=59" (but then line 488: "removing sector match... 60.00% Accuracy")
4. **Results section (line 467)**: Reports metrics on "N=198 held-out test split"

**CONFUSION**:
- Is the ablation on N=59 or N=60?
- Why does the abstract cite N=883 total but N=519+N=166+N=198 = 883 exactly?
- Are Table VI results (73.33% accuracy) from N=45 or N=198?

**VERIFICATION FROM FILES**:
- `testCases_v2_real.json`: Contains 883 pairs total
- `sbert-baseline-results_real.json`: "test_sample_count": 198
- `comprehensive-results_real.json`: "test_sample_count": 198

**CRITICAL ISSUE**: The paper **conflates multiple datasets** without clear delineation:
- N=45 (historical dataset, referenced in Table VI)
- N=59 (ablation subset?)
- N=198 (held-out test split)
- N=883 (full annotated dataset)

**A top-tier reviewer will reject the paper for lack of clarity on which results come from which dataset.**

---

### 1.3 DPCS Evaluation is Offline-Only but Presented as Production Feature

**PAPER CLAIMS** (lines 151-154):
> "Research Contributions: A cost-aware multi-stage event clustering framework (NISE) integrating an Enhanced Fusion Scoring Algorithm (EFSA) and Dynamic Publisher Credibility Scoring (DPCS)."

**BUT THE CODE COMMENTS STATE** (IEEE_RESEARCH_PAPER_14PAGES.md, line 247):
> "Implementation Note: DPCS's trust-scaling gating multiplier... is fully implemented in code (`backend/utils/dpcsEngine.js`) and evaluated offline across benchmark operating points, but is **not currently wired into the live production gate**"

**STATISTICAL RESULTS CONFIRM THIS** (`statistical_significance_results.json`):
- "EFSA+DPCS Full Pipeline": 18 TP, 81 FN → 18.18% recall
- "Production 2-Stage Baseline (NISE)": 25 TP, 74 FN → 25.25% recall

**CRITICAL PROBLEM**: DPCS is presented as a **core contribution** (#1 in the abstract, Algorithm 2 in methodology), but:
1. It's **not deployed in production** (only evaluated offline)
2. When integrated, it **reduces recall** (18.18% vs 25.25%) on the N=198 test set
3. The paper does not clearly distinguish "evaluated but not deployed" vs "deployed and operational"

**IEEE REVIEWERS WILL FLAG THIS** as misleading contribution claims.

---

### 1.4 Hypothesis H1/H2/H3 Are Not Explicitly Validated in Results

**PAPER STATES** (lines 143-146):
> - **H1 (Cost Reduction)**: Two-stage hybrid reduces LLM calls by >75%
> - **H2 (Evidence Fusion Superiority)**: EFSA outperforms single lexical filters
> - **H3 (Domain Generalization)**: Framework generalizes across 15 sectors without retraining

**RESULTS SECTION DOES NOT VALIDATE THESE**:

**H1 Validation**: 
- LaTeX line 467: "reducing LLM inference calls by 82.20%"
- ✓ Supported (though unclear if measured on N=45 or N=198)

**H2 Validation**: 
- Table VIII (line 493): EFSA alone achieves 60.00% accuracy
- But Jaccard alone: 68.89%, 3-Gram alone: 71.11% (from N=45 results)
- On N=198 test set: EFSA (52.02% acc) vs Jaccard (50.0% acc) vs 3-Gram (50.0% acc)
- **H2 is NOT clearly supported** - marginal 2% accuracy gain is not "significant outperformance"

**H3 Validation**: 
- Table XI (line 539): Shows per-sector breakdown (15 sectors, N=883)
- But this table uses **full dataset**, not held-out test split
- Cross-sector pairs achieve 100% accuracy (line 552) - but these are trivially easy (DIFFERENT by definition)
- **H3 is not rigorously validated on held-out data**

**CRITICAL ISSUE**: Reviewers expect explicit "Results: Hypothesis Testing" subsection with statistical validation of each hypothesis. This is missing.

---

### 1.5 Missing Theoretical Justification for Key Hyperparameters

**EFSA WEIGHTS** (Eq. 5, line 343):
```
S_EFSA = 0.25*S_key + 0.30*S_head + 0.25*S_ent + 0.10*S_temp + 0.10*S_sec
```

**QUESTION**: Why these specific weights?

**PAPER STATES** (line 342): "parameters optimized via validation split grid search"

**PROBLEM**: 
- No grid search results shown
- No ablation testing alternative weight configurations
- Table VIII tests component removal, but NOT weight tuning
- Manual weights sum to 1.0, but no comparison to learned weights (e.g., logistic regression)

**CRITICAL GAP**: Top-tier venues expect either:
1. **Principled derivation** (e.g., information-theoretic justification)
2. **Grid search results** showing performance vs. alternative configurations
3. **Learned weights** via supervised learning on training split

**The paper provides none of these.**

---

### 1.6 Threshold Selection (τ_J=0.12, τ_C=0.25) Not Justified

**PAPER STATES** (line 332-337):
```
J(A,B) >= 0.12   (Jaccard threshold)
cos(V_A,V_B) >= 0.25   (Cosine threshold)
```

**QUESTION**: Why 0.12 and 0.25?

**PAPER STATES** (line 241-242, Table II):
> "Validation split tuning maximizes recall"

**PROBLEM**:
- No precision-recall curve shown
- No threshold sensitivity analysis for Jaccard/Cosine
- DPCS has threshold sweep (Table XI), but basic gates do not
- Table VII shows EFSA at τ=0.18, 0.15, but not Jaccard/Cosine sweep

**CRITICAL GAP**: Reviewers will ask "Are these thresholds optimal? What if I use 0.08 or 0.15?"

---

## II. MAJOR IMPROVEMENTS NEEDED

### 2.1 Novelty Positioning is Weak

**CLAIM** (lines 56-65):
> "Algorithm 1 — Enhanced Fusion Scoring Algorithm (EFSA): A multi-dimensional evidence fusion model..."
> "Algorithm 2 — Dynamic Publisher Credibility Scoring (DPCS): A self-learning online credibility model..."

**REALITY CHECK**:

**EFSA Analysis**:
- **Novelty claim**: "Five-signal fusion with temporal decay and sector matching"
- **Reality**: Multi-signal entity resolution is standard (Christophides et al. 2020, cited as [b4])
- **What's new**: Application to news clustering + specific weight tuning
- **Novelty level**: **Incremental application**, not algorithmic breakthrough

**DPCS Analysis**:
- **Novelty claim**: "EMA-based online credibility scoring"
- **Reality**: EMA smoothing is textbook signal processing (1950s)
- **What's new**: Specific formula combining R_agree, I_time, F_cov, P_contra
- **Novelty level**: **Engineering heuristic**, not research contribution

**COMPARISON TO PRIOR WORK**:

| Work | Multi-evidence | Lexical gate | LLM verify | Cost analysis | Credibility |
|------|----------------|--------------|------------|---------------|-------------|
| Tarekegn 2024 | No | No | Yes | No | No |
| Nakshatri 2023 | No | Yes (temporal) | Yes | No | No |
| **NISE (this)** | **Yes (EFSA)** | **Yes (Jaccard+cosine)** | **Yes** | **Yes** | **Yes (DPCS)** |

**TRUE NOVELTY**: 
1. **Systems contribution**: Deployed end-to-end pipeline with cost-accuracy Pareto curves
2. **Benchmark contribution**: 883-pair dataset with κ=0.8612 dual-annotator agreement
3. **Transparency contribution**: Explicit cost modeling (\$7.52/1M vs \$11.60/1M)

**PROBLEM**: The paper positions EFSA and DPCS as **algorithmic contributions** when they are **engineering design choices**. This creates inflated novelty perception.

---

### 2.2 Related Work Section is Incomplete

**MISSING COMPARISONS**:

1. **Commercial Systems**:
   - Google News clustering (uses BERT + temporal decay, unknown details)
   - Apple News (uses on-device ML, unknown details)
   - **Issue**: No comparison to industry baselines

2. **Recent LLM News Aggregation (2024-2025)**:
   - Sufi 2025 [b18] is cited but not deeply compared
   - Missing: Retrieval-augmented generation (RAG) for news
   - Missing: Multi-document summarization literature (ACL 2024, EMNLP 2024)

3. **Fact Verification Systems**:
   - ClaimBuster (Univ. Texas Arlington)
   - FEVER dataset (fact extraction and verification)
   - **Issue**: Hallucination guardrail is claimed but not benchmarked against FEVER

4. **Multi-Document Summarization**:
   - Multi-News dataset (Fabbri et al. 2019)
   - WCEP dataset (Gholipour et al. 2020)
   - **Issue**: Evidence fusion is claimed but not compared to MDS literature

**CRITICAL GAP**: Section 2.10 states "No reviewed work combines cost-aware multi-stage pre-filtering..." but the literature review is too narrow to support this claim.

---

### 2.3 Experimental Design Has Serious Flaws

**FLAW 1: No Cross-Validation**
- 60/20/20 split is done ONCE with seed=42
- No k-fold cross-validation
- No error bars across multiple splits
- **Issue**: Results may be sensitive to specific split

**FLAW 2: Validation Set Contamination Risk**
- Thresholds tuned on validation set (N=166)
- Final results reported on test set (N=198)
- **BUT**: EFSA weights, Jaccard threshold, DPCS parameters all "optimized via validation split"
- **Issue**: Risk of indirect test set leakage via hyperparameter tuning

**FLAW 3: Inter-Annotator Agreement Claimed But Not Used**
- Cohen's κ=0.8612 reported (lines 88, 298)
- Dual-annotator labels collected (annotator_A.json, annotator_B.json)
- **BUT**: No analysis of disagreement cases
- **BUT**: No per-difficulty-tier κ reported
- **Issue**: High-level κ hides potential bias in Hard cases

**FLAW 4: Difficulty Stratification Not Properly Evaluated**
- 120 Easy (13.6%), 350 Medium (39.6%), 413 Hard (46.8%) - lines 300-301
- Table X (line 536) shows per-difficulty breakdown on **full N=883 dataset**
- **BUT**: No per-difficulty breakdown on **held-out test split N=198**
- **Issue**: Cannot assess if system fails disproportionately on Hard cases in test set

---

### 2.4 Cost Model Lacks Transparency

**PAPER CLAIMS** (line 466):
> "reducing total ingestion cost from \$11.60/1M to \$7.52/1M article pairs"

**QUESTIONS A REVIEWER WILL ASK**:

1. **What API pricing is assumed?**
   - Groq Llama-3.1-8B-instant: \$X per 1M tokens?
   - Average tokens per headline pair?
   - Cost breakdown not shown

2. **What is "1M article pairs"?**
   - 1 million candidate pairs evaluated?
   - Or 1 million articles ingested (with avg K candidates each)?
   - Terminology is ambiguous

3. **Why is LLM-Only \$11.60/1M?**
   - If 1M pairs × (input_tokens + output_tokens) × Groq_price = \$11.60
   - But no equation shown
   - `costAnalysis.js` exists but results not detailed in paper

4. **What about EFSA compute cost?**
   - "negligible relative to LLM cost" (line 509)
   - But entity extraction (spaCy?) has non-zero CPU cost
   - Character n-gram computation for K candidates

**CRITICAL GAP**: Top-tier venues expect **detailed cost breakdown table**:
```
| Operation | CPU Time | GPU Time | API Cost | Total \$/1M |
| Jaccard gate | 0.08ms | 0 | \$0 | \$0 |
| EFSA computation | 2.1ms | 0 | \$0 | \$0 |
| LLM verification | 2994ms | 0 | \$X | \$Y |
| Total (two-stage) | ... | ... | ... | \$7.52 |
| Total (LLM-only) | ... | ... | ... | \$11.60 |
```

**The paper does not provide this table.**

---

### 2.5 Algorithmic Complexity Analysis is Superficial

**PAPER PROVIDES** (Table IX, lines 504-511):
- Jaccard: O(K) time, O(W) space
- EFSA: O(K·E) time, O(E) space  
- DPCS: O(1) time, O(P) space

**PROBLEMS**:

1. **K is not defined clearly**:
   - Line 516: "K ≈ 15-30" (candidate events in 48-hour window)
   - But this is **empirical observation**, not worst-case analysis
   - What if K=1000 during breaking news? (e.g., election night)

2. **Entity extraction cost hidden**:
   - S_ent requires NER (Named Entity Recognition)
   - NER is O(n) per headline (n = token count)
   - Total: O(K·n_avg) NER operations per article
   - **Not mentioned in complexity table**

3. **No space complexity for LLM**:
   - Stage 2 requires loading prompt + context into LLM
   - Prompt engineering costs (few-shot examples)
   - **Not analyzed**

4. **No amortized analysis**:
   - First article: compare to 0 events → 0 comparisons
   - 100th article: compare to 30 events → 30 comparisons
   - Average over N articles?
   - **Not discussed**

**CRITICAL GAP**: ACM/IEEE systems papers expect **detailed complexity analysis** with constants, not just asymptotic notation.

---

## III. MINOR ENHANCEMENTS (Polish for Top-Tier Venue)

### 3.1 Statistical Rigor Issues

**McNemar Test Claimed But Not Detailed**:
- Line 467: "McNemar's paired chi-square test confirms... (p < 0.005)"
- `mcnemar_tests.json` file exists
- **BUT**: No contingency table shown in paper
- **BUT**: No correction for multiple comparisons (9 baselines → 36 pairwise tests)

**Wilson CIs Provided But Not Interpreted**:
- Line 466: "62.63% accuracy (95% Wilson CI: [55.71%, 69.06%])"
- Good: Uses Wilson intervals (better than Wald)
- **BUT**: No discussion of overlap between systems
- **BUT**: No confidence intervals on cost savings

---

### 3.2 Writing Quality Issues

**1. Inconsistent Terminology**:
- "Event clustering" vs "Event deduplication" vs "Event matching" used interchangeably
- "Gate" vs "Pre-filter" vs "Stage 1" not consistently defined

**2. Passive Voice Overuse**:
- "is computed" (line 362), "is evaluated" (line 380)
- Better: "We compute", "We evaluate"

**3. Figure Quality**:
- Fig 1 (pipeline): Good
- Fig 4 (Pareto scatter): Good
- Fig 3 (ERD): Too small, text unreadable at column width

**4. Table Formatting**:
- Tables I-IV are images (PNG), not LaTeX tables
- Reduces accessibility and editability
- IEEE may require LaTeX table source

---

### 3.3 Missing Ablations

**NEEDED ABLATIONS**:

1. **LLM Provider Ablation**:
   - Claims "open-weight Llama 3.1-8B"
   - What about GPT-4-mini? Claude-3-Haiku?
   - Cost-accuracy tradeoff across LLM families?

2. **Prompt Engineering Ablation**:
   - Zero-shot prompt shown (lines 325-328)
   - What about few-shot? (Mentioned in line 573 case study)
   - No systematic prompt ablation

3. **Temporal Window Ablation**:
   - 48-hour window claimed (line 241)
   - What about 24h? 72h? 7d?
   - Table II shows "24-hour or 72-hour windows" as alternatives, but no evaluation

4. **Sector Taxonomy Ablation**:
   - 14 sectors defined
   - What if merged to 7 coarse categories?
   - What if removed entirely?
   - Table VIII removes S_sec (44.44% acc) but doesn't explore alternatives

---

### 3.4 Reproducibility Checklist Incomplete

**GOOD**:
- Dataset released (testCases_v2_real.json)
- Code on GitHub (implied)
- Dual-annotator labels provided

**MISSING**:
1. **Model Checkpoint**: Which Llama 3.1-8B checkpoint? (Meta official? Groq-optimized?)
2. **Prompt Artifacts**: Full system prompt with few-shot examples
3. **Preprocessing Scripts**: Tokenization, stopword list, NER model version
4. **Hyperparameter Grid**: What values of τ_J, τ_C, τ_EFSA were tested?
5. **Hardware Specs**: CPU model? RAM? (Line 665: Intel i7-12700K, but no GPU specs)

---

## IV. SECTION-BY-SECTION REWRITE PRIORITIES

### Priority 1 (CRITICAL - Must Fix for Acceptance):

**Section 5 (Results)**:
- **Current**: Conflates N=45, N=59, N=198, N=883 results
- **Fix**: Separate subsections:
  - 5.1: Held-Out Test Set Results (N=198 only)
  - 5.2: Full Dataset Analysis (N=883, stratified by difficulty)
  - 5.3: Ablation Study (clearly state N=59 or N=883)
  - 5.4: Cost Analysis (detailed \$ breakdown table)

**Table VI (Baseline Comparison)**:
- **Current**: Shows N=45 results (73.33% accuracy, 35.29% recall)
- **Fix**: Replace with N=198 results (62.63% accuracy, 25.25% recall per Wilson CI)
- **OR**: Clearly label as "N=45 Historical Results" and add new Table VI-B for N=198

**Section 3.6 (EFSA Justification)**:
- **Current**: "parameters optimized via validation split grid search" (line 342)
- **Fix**: Show grid search results:
  - Tested weight configurations: uniform (0.2, 0.2, 0.2, 0.2, 0.2) vs current
  - Ablation: equal weights vs tuned weights
  - Learned weights: logistic regression on train split

---

### Priority 2 (MAJOR - Significantly Strengthen):

**Section 1.5 (Research Contributions)**:
- **Current**: "A cost-aware multi-stage event clustering framework (NISE) integrating EFSA and DPCS"
- **Fix**: Reposition novelty:
  - **Systems contribution**: Deployed pipeline with cost-accuracy Pareto analysis
  - **Benchmark contribution**: 883-pair dataset with κ=0.8612 agreement
  - **Engineering contribution**: EFSA and DPCS as design patterns (not algorithmic breakthroughs)

**Section 2 (Related Work)**:
- **Add**: Commercial news clustering (Google News, Apple News, Event Registry)
- **Add**: Multi-document summarization literature (Multi-News, WCEP)
- **Add**: Fact verification systems (FEVER, ClaimBuster)
- **Add**: Recent RAG-based news systems (2024-2025)

**Section 5.8 (Threats to Validity)**:
- **Current**: Acknowledges single-annotator on N=45, evaluation scale issues
- **Fix**: Add threats:
  - Cross-validation not performed (single split)
  - Validation set contamination risk (hyperparameter tuning)
  - Per-difficulty performance not reported on held-out test
  - DPCS not deployed in production (offline evaluation only)

---

### Priority 3 (MINOR - Polish):

**Abstract**:
- **Current**: 13 lines, dense
- **Fix**: Simplify to 10 lines, lead with research question

**Section 5.7 (Hypothesis Validation)**:
- **Add**: Explicit subsection "Hypothesis Testing"
  - H1: ✓ Supported (82.2% call reduction, p<0.005 McNemar)
  - H2: ✗ Not clearly supported (marginal EFSA improvement)
  - H3: ⚠ Partially supported (cross-sector 100% acc, but trivial)

**Figures**:
- **Fig 3 (ERD)**: Increase font size, convert to vector (SVG)
- **Fig 6 (Latency boxplot)**: Add median line, annotate outliers

---

## V. EXAMPLE REVIEWER COMMENTS

**Reviewer 1 (Methodology Expert)**:
> "The paper presents an interesting systems contribution, but I have serious concerns about the evaluation methodology. The authors claim 62.63% accuracy on an N=198 test set, but their comprehensive results file shows the production baseline has only 1.01% recall on this same test set. This 40x discrepancy suggests the paper is reporting results from an earlier N=45 dataset instead of the held-out test split. Additionally, DPCS is presented as a core algorithmic contribution (#1 in the abstract) but is not deployed in production and actually reduces recall when integrated. I recommend major revisions to clarify which results come from which datasets and to reposition DPCS as an experimental offline evaluation component rather than a production algorithm."

**Reviewer 2 (Novelty Expert)**:
> "EFSA and DPCS are presented as novel algorithms, but EFSA is standard multi-signal entity resolution (Christophides et al. 2020) with domain-specific weight tuning, and DPCS is textbook EMA smoothing applied to credibility scores. The true novelty is the systems contribution (deployed pipeline with cost-accuracy analysis) and the benchmark contribution (883-pair dataset with κ=0.8612). I recommend repositioning the contributions: (1) systems, (2) benchmark, (3) engineering patterns, rather than claiming algorithmic breakthroughs. The paper would be stronger if it honestly acknowledged that EFSA and DPCS are engineering design choices, not research contributions."

**Reviewer 3 (Reproducibility Expert)**:
> "Hypothesis H2 claims EFSA outperforms single lexical filters, but Table VIII shows EFSA alone (60.00% acc) underperforms Jaccard (68.89% acc) and 3-Gram (71.11% acc) on the N=45 dataset. On the N=198 test set, EFSA achieves 52.02% vs Jaccard 50.0% - only a 2% gain. This does not constitute 'significant outperformance'. Additionally, the EFSA weight configuration (0.25, 0.30, 0.25, 0.10, 0.10) is claimed to be 'optimized via validation split grid search', but no grid search results are shown. I recommend adding a threshold sensitivity analysis for Jaccard/Cosine (similar to Table XI for DPCS) and showing the grid search results that justify the EFSA weight configuration."

---

## VI. RECOMMENDED REVISION ROADMAP

### Phase 1: Critical Fixes (Weeks 1-2)

**Week 1**:
1. Audit all results: which are N=45, N=59, N=198, N=883?
2. Create master spreadsheet mapping each table/figure to dataset
3. Rewrite Section 5.1-5.2 to separate N=198 (held-out test) from N=883 (full dataset)
4. Update Table VI with N=198 results (62.63% acc, 25.25% recall)

**Week 2**:
1. Reposition DPCS: "Experimental Credibility Scoring (Offline Evaluation)"
2. Move DPCS from "Research Contributions" to "Engineering Contributions"
3. Add explicit "Hypothesis Testing" subsection validating H1, H2, H3
4. Fix H2 validation: show that EFSA (52.02%) does NOT significantly outperform Jaccard (50.0%) on N=198

---

### Phase 2: Major Improvements (Weeks 3-4)

**Week 3**:
1. Expand Related Work: add Google News, Apple News, Event Registry, Multi-Doc Summarization
2. Add cost breakdown table: detailed \$/1M calculation with API pricing assumptions
3. Add EFSA weight grid search results: uniform vs tuned vs learned weights
4. Add Jaccard/Cosine threshold sensitivity analysis (similar to Table XI)

**Week 4**:
1. Add per-difficulty breakdown on N=198 held-out test (not just N=883)
2. Add inter-annotator agreement per difficulty tier (κ_Easy, κ_Medium, κ_Hard)
3. Expand Threats to Validity: cross-validation, validation contamination, DPCS offline-only
4. Add detailed complexity analysis: include NER cost, amortized analysis, worst-case K

---

### Phase 3: Polish (Week 5)

1. Rewrite abstract: simplify to 10 lines, lead with research question
2. Convert Fig 3 (ERD) to vector, increase font size
3. Convert Tables I-IV from PNG to LaTeX tables
4. Add reproducibility checklist: model checkpoint, prompt artifacts, preprocessing scripts
5. Add McNemar contingency tables, correct for multiple comparisons
6. Proofread: fix passive voice, inconsistent terminology

---

## VII. FINAL VERDICT

**CURRENT STATE**: The paper represents substantial engineering effort (deployed system, 883-pair benchmark) but suffers from critical methodological flaws (dataset confusion, DPCS misrepresentation, weak novelty positioning) that prevent acceptance.

**ESTIMATED REVISION EFFORT**: 5 weeks full-time work (1 week critical fixes, 2 weeks major improvements, 1 week analysis/experiments, 1 week writing/polish)

**POST-REVISION ASSESSMENT**:
- **Top-tier venue (NeurIPS, ICML, ACL)**: Likely reject even after revision (novelty too incremental)
- **Second-tier venue (EMNLP Findings, NAACL Industry)**: Accept after major revision (strong systems contribution)
- **Domain venue (CIKM, WWW, SIGIR)**: Accept after major revision (news clustering is in scope)
- **Workshop venue (NLP for News, AI Systems)**: Accept after minor revision (good fit)

**RECOMMENDED VENUE**: EMNLP 2026 Industry Track or CIKM 2026 Applied Track (after addressing critical issues)

---

## VIII. STRENGTH ACKNOWLEDGMENTS (To Be Fair)

**GENUINE STRENGTHS**:

1. **Deployed System**: Unlike most academic papers, NISE is actually running in production (21 RSS feeds, 14 sectors, weekly cron)

2. **Cost-Accuracy Analysis**: Explicit cost modeling (\$7.52/1M vs \$11.60/1M) is rare in NLP papers and valuable for practitioners

3. **Benchmark Release**: 883-pair dataset with κ=0.8612 dual-annotator agreement is a genuine contribution to the community

4. **Statistical Rigor**: Wilson confidence intervals, McNemar tests, inter-annotator agreement - proper statistical methodology

5. **Transparency**: The paper honestly reports failures (1.01% recall on lexical baseline, DPCS offline-only) rather than hiding them

6. **Engineering Quality**: The system handles ingestion, clustering, hallucination checking, image generation, webhook distribution - substantial scope

**The paper is not bad research. It's good systems work that needs better positioning and clearer evaluation reporting.**

---

## IX. SPECIFIC QUESTIONS FOR AUTHORS

1. **Dataset Confusion**: Are Table VI results (73.33% accuracy, 35.29% recall) from N=45 or N=198? Why does `comprehensive-results_real.json` show 1.01% recall on N=198?

2. **DPCS Deployment**: Is DPCS deployed in production or not? If not, why is it presented as a core contribution (#1 in abstract)?

3. **EFSA Weight Tuning**: What grid search was performed? Can you show results for uniform weights vs tuned weights vs learned weights?

4. **Hypothesis H2**: How can you claim EFSA outperforms single lexical filters when Table VIII shows EFSA (60.00%) < Jaccard (68.89%)? Is this due to different datasets?

5. **Cost Model**: What API pricing is assumed? Can you provide a detailed cost breakdown table showing per-operation costs?

6. **Temporal Window**: Why 48 hours? Was 24h/72h tested? Can you show ablation results?

7. **Cross-Validation**: Why was cross-validation not performed? Are results sensitive to the specific 60/20/20 split?

8. **LLM Ceiling**: Why does "LLM-Only Upper Bound" achieve 100% accuracy (Table VI, N=45) but only 50% on N=198 with 99 FP? Is this a bug in the evaluation script?

9. **Semantic Gate**: Why is the semantic embedding gate (88.89% acc, 76.47% recall) not the production baseline if it strictly dominates EFSA at all operating points?

10. **Real vs Synthetic**: Some test cases are labeled "Synthetic example" (testCases_v2_real.json, lines 14, 28, 42) - what fraction of the 883-pair dataset is synthetic vs real?

---

## X. CONCRETE NEXT STEPS

**Step 1**: Freeze all result files (with Git tags) and create a master mapping document:
```
Table VI (LaTeX) → eval_dataset=N45_historical.json, date=2026-07-28
Table VII (LaTeX) → eval_dataset=N45_historical.json, date=2026-07-28  
Table baseline (LaTeX line 467) → eval_dataset=N198_test_split, date=2026-08-03
comprehensive-results_real.json → eval_dataset=N198_test_split, date=2026-08-03
```

**Step 2**: Rewrite Results section with clear subsection structure:
```
Section 5.1: Held-Out Test Set Evaluation (N=198)
  - Primary baselines: Jaccard, 3-Gram, EFSA, SBERT, Two-Stage, LLM-Only
  - McNemar pairwise tests
  - Wilson CIs
  
Section 5.2: Full Dataset Stratified Analysis (N=883)
  - Per-difficulty breakdown (Easy, Medium, Hard)
  - Per-sector breakdown (15 sectors)
  - Learning curves (vary train size)

Section 5.3: Ablation Studies
  - EFSA 5-component ablation (N=59 subset or full N=883?)
  - EFSA weight sensitivity (uniform vs tuned vs learned)
  - Threshold sensitivity (Jaccard, Cosine, EFSA)
  - Temporal window (24h, 48h, 72h)

Section 5.4: Cost-Accuracy Analysis
  - Detailed cost breakdown table
  - Pareto frontier plot
  - Latency measurements

Section 5.5: Hypothesis Testing
  - H1: Call reduction (82.2%, p<0.005) ✓ SUPPORTED
  - H2: EFSA superiority (52.02% vs 50.0%, p=?) ✗ NOT SUPPORTED
  - H3: Domain generalization (per-sector analysis) ⚠ PARTIALLY SUPPORTED
```

**Step 3**: Reposition contributions in Section 1.5:
```
Research Contributions (reordered by novelty):
1. Systems Contribution: Deployed cost-aware news aggregation pipeline with empirical cost-accuracy Pareto analysis ($7.52/1M vs $11.60/1M)
2. Benchmark Contribution: 883-pair multi-domain dataset with dual-annotator agreement (κ=0.8612 ± 0.0380), publicly released for community evaluation
3. Statistical Analysis: Wilson 95% CIs, McNemar paired tests (p<0.005), per-difficulty stratification (Easy/Medium/Hard)
4. Engineering Patterns: EFSA multi-evidence fusion and DPCS online credibility scoring (evaluated offline) as reusable design patterns

Engineering Contributions:
[move current "Engineering Contributions" here]
```

**Step 4**: Fix DPCS positioning throughout paper:
- Abstract: Remove DPCS from primary contributions
- Section 3.7: Add NOTE: "DPCS is evaluated offline but not deployed in production baseline"
- Table VI: Remove "EFSA+DPCS" row (or clearly mark "offline only")
- Conclusion: "DPCS shows promise in offline evaluation but requires production validation"

**Step 5**: Add missing ablations:
- Jaccard/Cosine threshold sweep (like Table XI for DPCS)
- EFSA weight grid search results
- Temporal window ablation (24h, 48h, 72h)
- LLM provider ablation (if feasible: Llama vs GPT-4-mini vs Claude-3-Haiku)

**Step 6**: Expand Related Work:
- Add paragraph on Google News, Apple News, Event Registry (commercial systems)
- Add paragraph on multi-document summarization (Multi-News, WCEP)
- Add paragraph on fact verification (FEVER, ClaimBuster)
- Rewrite Section 2.10 synthesis with expanded literature

**Step 7**: Proofread and polish:
- Simplify abstract to 10 lines
- Fix inconsistent terminology (event clustering/deduplication/matching)
- Convert Tables I-IV from PNG to LaTeX
- Increase Fig 3 font size
- Add reproducibility checklist appendix

---

## CONCLUSION

This is **good systems work** hampered by **poor positioning and unclear evaluation reporting**. The deployed system, benchmark dataset, and cost-accuracy analysis are valuable contributions. However, the paper:

1. Conflates multiple datasets (N=45, N=59, N=198, N=883) without clear delineation
2. Presents DPCS as a core contribution despite being offline-only and reducing recall
3. Overstates EFSA/DPCS novelty (engineering heuristics, not algorithmic breakthroughs)
4. Does not rigorously validate stated hypotheses H1/H2/H3
5. Lacks transparency in hyperparameter tuning and cost modeling

**With 5 weeks of focused revision addressing the Priority 1 and Priority 2 issues, this paper could be accepted at EMNLP Industry Track or CIKM Applied Track.**

**Without major revisions, this paper will be rejected at any top-tier venue.**

---

**End of Review**
