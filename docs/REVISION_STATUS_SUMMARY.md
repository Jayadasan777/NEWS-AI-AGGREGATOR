# NISE Paper Revision Status Summary
**Date:** 2026-10-13  
**Paper:** A Cost-Aware Multi-Stage Framework for Automated News Event Clustering and Social Media Distribution

---

## Conference Status Overview

### ✅ INERTCON2026 - **CONDITIONALLY ACCEPTED** (Minor Revisions Required)
- **Deadline:** 2026-09-04 ⚠️ **OVERDUE** - Submit ASAP!
- **Status:** All requested revisions have been completed in `NISE-Paper.tex`

### ❌ ICECONF2026 - **REJECTED**
- **Primary Issues:** Insufficient justification of thresholds, limited benchmark description, weak experimental comparison, inconsistent threshold reporting

### ❌ ICCMN 2026 - **DESK REJECTED**
- **Primary Issues:** Lacks novelty, insufficient technical depth, needs substantial methodological improvement

---

## ✅ COMPLETED REVISIONS (INERTCON2026)

### 1. ✅ Threshold Inconsistency Fixed (Reviewer #1, Comment 1)
**Problem:** Section III-F stated 0.65 threshold, Section IV-F stated 0.4
**Solution:** 
- Corrected Section IV-F to consistently use **$S_{\text{sem}} \ge 0.65$**
- Verified consistency across all sections (lines 169, 171, 224, 276)

### 2. ✅ DPCS Demoted from Core Contribution (Reviewer #1, Comment 2)
**Problem:** DPCS presented as main contribution but explicitly stated as ineffective
**Solution:**
- Removed DPCS from abstract and introduction core contributions
- Added empirical comparison in Table II (lines 277, 287)
- DPCS shows 91.10% accuracy vs. 93.93% for canonical pipeline (-2.83% recall)
- Reframed as "experimental exploratory module" (lines 150-151, 222, 362)

### 3. ✅ Ablation Study Added (Reviewer #1, Comment 3)
**Problem:** Claimed ablation study was never shown
**Solution:**
- Added complete **Table III** with Leave-One-Signal-Out (LOSO) analysis (lines 289-310)
- Character 3-Gram removal: -7.42% accuracy impact (largest)
- Keyword IoU removal: -5.18% impact
- Named Entity removal: -4.30% impact
- Sector Match removal: -2.15% impact
- Temporal Decay removal: -1.88% impact

### 4. ✅ Numbering Scheme Standardized (Reviewer #2, Comment 1)
**Problem:** Mixed Roman/decimal numbering (Section III vs. Section 3.x)
**Solution:**
- Standardized to IEEE format throughout
- Sections: Roman numerals (I, II, III, IV, V, VI)
- Subsections: Roman-Letter (III-A, IV-B, etc.)
- Figures: Fig. 1, Fig. 2, Fig. 3, etc.
- Tables: Table I, Table II, Table III, etc.

### 5. ✅ Pareto Trade-off Analysis Added (Reviewer #2, Comment 2)
**Problem:** Title promises "empirical trade-off analysis" but only shows 2 operating points
**Solution:**
- Added **Table IV: Parameter Sensitivity and Cost-Accuracy Pareto Sweep** (lines 321-343)
- Shows multi-point threshold sweeps
- EFSA threshold analysis ($S_{\text{EFSA}} \in [0.10, 0.40]$)
- Justifies 0.22 as Pareto elbow point
- Cost analysis: $0.00 to $11.60 per 1M comparisons

### 6. ✅ Related Work Restructured (Reviewer #2, Comment 3)
**Problem:** Citation list format, not comparative synthesis
**Solution:**
- Reorganized into 3 thematic clusters (lines 88-99):
  - II-A: Lexical, Topic, and Graph-Based Clustering
  - II-B: Dense Semantic Embeddings
  - II-C: LLM Verification and Gated Cascades
- Each subsection explicitly contrasts with NISE's approach

---

## ⚠️ REMAINING CONCERNS (Based on Other Rejections)

### From ICECONF2026 Rejection:

#### 1. ⚠️ Threshold Selection Justification (Point 1)
**Status:** PARTIALLY ADDRESSED
- Jaccard threshold (0.12): ❓ Not empirically justified
- Character 3-gram threshold (0.25): ❓ Not empirically justified
- EFSA threshold (0.22): ✅ Pareto analysis added
- Fusion weights: ❓ Need validation experiment description

**Recommendation:** Add subsection showing grid search or sensitivity analysis for lexical thresholds

#### 2. ⚠️ Benchmark Construction Details (Point 2)
**Status:** PARTIALLY ADDRESSED
- Lines 252-259 describe benchmark but could be more detailed:
  - ✅ 5,000 pairs, 14 sectors, 18 RSS feeds
  - ✅ 2,500 positive, 2,500 negative pairs
  - ✅ Fleiss' κ = 0.884
  - ✅ 60/20/20 train/val/test split
  - ❓ HOW were positive pairs generated? (Manual annotation? Automatic?)
  - ❓ HOW were negative pairs selected?
  - ❓ WHO were the annotators? (domain experts? crowdsourced?)

**Recommendation:** Expand Section V-A with detailed annotation protocol

#### 3. ❌ Limited State-of-the-Art Comparison (Point 3)
**Status:** NOT ADDRESSED
- Table II compares against baselines but NOT against existing event clustering methods
- Missing comparisons:
  - No comparison with TDT (Topic Detection & Tracking) methods
  - No comparison with recent neural clustering (e.g., hierarchical BERT clustering)
  - No comparison with graph-based event detection
  - No comparison with existing news clustering systems (Google News clusters, etc.)

**Recommendation:** Add comparative experiments OR explicitly state this is a novel production-focused framework not directly comparable

#### 4. ❌ Individual Component Contribution Analysis (Point 4)
**Status:** PARTIALLY ADDRESSED
- ✅ EFSA ablation added (Table III)
- ❌ No ablation showing:
  - Lexical gates (Stage 1) contribution
  - What if we skip Stage 1 and go directly to EFSA?
  - What if we skip EFSA and use lexical + LLM only?
  - Contribution of each stage to the 82.2% reduction

**Recommendation:** Add stage-by-stage ablation table

#### 5. ⚠️ Cost Analysis Incomplete (Point 5)
**Status:** PARTIALLY ADDRESSED
- ✅ 82.2% LLM query reduction reported
- ✅ Cost per 1M comparisons: $2.06 vs. $11.60
- ✅ Throughput: 45.2 pairs/sec
- ✅ Latency: 642ms average
- ❓ GPU vs. CPU resource comparison missing
- ❓ Actual $ spent per day/month not provided
- ❓ Scalability analysis (what happens at 10K articles/day?) missing

**Recommendation:** Add deployment cost section with actual operational expenses

#### 6. ✅ Consistency Check (Point 6)
**Status:** FIXED
- Threshold inconsistency resolved (0.65 consistently used)

#### 7. ⚠️ Reproducibility Details (Point 7)
**Status:** INCOMPLETE
- ❓ Software versions not specified (Python version, PyTorch version, etc.)
- ❓ Model API configuration (Groq Llama 3.1-8B-Instant parameters)
- ❓ Hardware specs mentioned but not comprehensive
- ❓ Preprocessing procedures not detailed
- ❓ Code/data availability statement missing

**Recommendation:** Add "Implementation Details" subsection OR supplementary materials section

#### 8. ⚠️ Technical Proofreading (Point 8)
**Status:** NEEDS VERIFICATION
- Terminology consistency ✅ appears good
- Notation consistency ✅ improved
- Equation formatting ✅ standardized
- Figure/table references ✅ standardized
- IEEE conventions ✅ applied

**Recommendation:** Final pass for typos, grammar, formatting

---

## 📋 ACTION ITEMS FOR FINAL SUBMISSION

### CRITICAL (Must Fix for INERTCON2026)
1. ✅ All INERTCON2026 reviewer comments addressed
2. ⚠️ **OVERDUE DEADLINE** - Submit immediately with current revisions
3. ✅ Response to reviewers document prepared (`RESPONSE_TO_REVIEWERS_INERTCON2026.md`)

### HIGH PRIORITY (Strengthen for Future Submissions)
1. ❌ Add detailed annotation protocol for benchmark construction
2. ❌ Add stage-by-stage pipeline ablation (not just EFSA signals)
3. ❌ Add grid search justification for lexical thresholds
4. ❌ Add reproducibility section with full implementation details

### MEDIUM PRIORITY (Address ICCMN Concerns)
1. ❌ Reduce mathematical formalism (they want "theoretical" but "not many numbers")
2. ❌ Add more conceptual/architectural discussion
3. ❌ Simplify equations (use fewer complex formulas)
4. ❌ Strengthen novelty argument more clearly

### LOW PRIORITY (Future Enhancements)
1. ❌ Compare against existing state-of-the-art event clustering methods
2. ❌ Add actual operational cost analysis ($ per month)
3. ❌ Add scalability experiments (10K, 100K articles/day)
4. ❌ Make benchmark dataset publicly available

---

## 🎯 IMMEDIATE NEXT STEPS

### For INERTCON2026 (URGENT - OVERDUE):
1. **Verify** all changes are in `NISE-Paper.tex` ✅
2. **Compile** LaTeX to PDF and check formatting
3. **Upload** revised manuscript to conference portal
4. **Upload** response-to-reviewers document
5. **Email** conference chair about late submission with explanation

### For Future Conferences (After INERTCON2026):
1. **Address** ICECONF2026 points 1, 2, 4, 5, 7
2. **Simplify** paper per ICCMN feedback (less math, more concepts)
3. **Target** conferences that value production systems over pure novelty
4. **Consider** splitting into:
   - Journal paper (full technical depth, reproducibility)
   - Conference paper (streamlined, key contributions)

---

## 📊 PAPER CURRENT STATE

### Strengths:
- ✅ Clear problem formulation
- ✅ Well-structured multi-stage pipeline
- ✅ Strong empirical results (93.93% accuracy, 100% precision)
- ✅ Practical production deployment (1,450 articles/day)
- ✅ Cost-aware design (82.2% reduction)
- ✅ Comprehensive ablation study added
- ✅ Pareto trade-off analysis included

### Weaknesses to Address:
- ⚠️ Limited comparison with state-of-the-art methods
- ⚠️ Benchmark annotation protocol underspecified
- ⚠️ Threshold selection process could be more rigorous
- ⚠️ Reproducibility details incomplete
- ⚠️ Stage-level contribution analysis missing
- ⚠️ Novelty argument could be stronger (per ICCMN)

---

## 📝 NOTES

### Why INERTCON2026 Accepted:
- Reviewers focused on **technical correctness** and **completeness**
- Valued **production deployment** experience
- Appreciated **cost-aware** design philosophy
- All technical concerns were addressable through revision

### Why ICECONF2026/ICCMN Rejected:
- Expected comparison with **existing state-of-the-art**
- Wanted more **methodological rigor** in threshold selection
- Sought **novel algorithmic contributions** (not just engineering)
- Desired deeper **theoretical analysis**

### Key Insight:
NISE is a **production engineering contribution** (systems paper) rather than a **pure research novelty** (algorithms paper). Target conferences accordingly:
- ✅ Good fit: Systems, Industrial, Applied AI conferences
- ❌ Poor fit: Theory, Pure ML/NLP, Novel Algorithm conferences

---

## 🔄 VERSION CONTROL

- **Original Draft:** Multiple rejections due to incomplete evaluation
- **Revision 1 (Current):** INERTCON2026 minor revisions addressed
- **Next Version:** Should address ICECONF2026 points for journal submission

**Last Updated:** 2026-10-13
