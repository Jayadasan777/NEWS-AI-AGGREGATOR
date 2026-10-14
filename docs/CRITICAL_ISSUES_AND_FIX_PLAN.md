# CRITICAL ISSUES - DO NOT SUBMIT CURRENT VERSION

**Date:** 2026-10-13  
**Status:** PAPER HAS MAJOR DATA INTEGRITY PROBLEMS  

---

## 🚨 CRITICAL PROBLEMS IDENTIFIED

### **PROBLEM 1: Impossible Math - Two Different Datasets**

**Evidence:**
- N=1,022 full benchmark: 512 positive, 510 negative pairs
- Test set N=198: 99 positive, 99 negative (claimed to be subset)
- Full results: TP=450 (found 450 of 512 positives)
- Test results: TP=25 (found 25 of 99 positives)

**Math Check:**
- If test is subset: Remaining = 512 - 99 = 413 positive pairs
- Full TP - Test TP = 450 - 25 = **425 true positives**
- **IMPOSSIBLE:** Cannot find 425 matches from 413 pairs

**Conclusion:** The 93.93% (N=1,022) and 62.63% (N=198) results come from:
- Different classifier configurations, OR
- Different datasets, OR
- Different evaluation runs

**They are NOT from the same cascade on train/test splits.**

---

### **PROBLEM 2: LLM Call Reduction is Fiction**

**Contradictory Claims:**
1. Paper says: "EFSA passes 891 pairs (450 TP + 441 FP)"
   - 891/1,022 = **87% of pairs pass through**
   - Only 13% filtered by EFSA gate
   
2. Paper claims: "82.2% LLM call reduction"
   - This means only 18% reach LLM
   - Contradicts 87% pass rate

3. Paper says: "182 pairs sent to LLM" (Line 231)
   - 182/1,022 = 17.8% ≈ 18%
   - But if EFSA passes 891, and threshold is 0.22, how do only 182 exceed it?

4. Paper says: "177,768 per million" (Table IV)
   - 177,768/1,000,000 = 17.8%
   - Consistent with 182/1,022, NOT with 891 pass count

**The Truth:**
- Either EFSA passes 891 (0% savings), OR
- LLM sees 182 pairs (82% savings)
- **Cannot be both**

**Missing Data:**
- How many pairs pass Stage 1 (lexical gates)?
- How many pairs exceed EFSA threshold ≥0.22?
- How many actually reach LLM?

---

### **PROBLEM 3: Cost Arithmetic is Wrong**

**Paper Claims:**
- 42 input tokens × $0.05/1M = $0.0000021
- 18 output tokens × $0.08/1M = $0.0000014
- **Total: $0.0000035 per call**
- × 1,000,000 calls = **$3.50 per 1M**

**Paper Says:**
- "$11.50 LLM cost per 1M" (Table IV)
- This is **3.3× too high**

**Correct Calculation:**
```
LLM-only: 1M calls × $0.0000035 = $3.50
NISE: 177,768 calls × $0.0000035 = $0.62
Savings: $3.50 - $0.62 = $2.88 (82.2% reduction)
```

**Not "$11.60 vs $7.52" as claimed.**

**Annual Savings Reality:**
- Paper: $0.45/year at 10K articles/day
- **No reviewer will care** about $0.45/year savings
- Should frame around **latency**, **rate limits**, or **scalability**, not dollars

---

### **PROBLEM 4: Test Set Data Looks Fabricated**

**From statistical_significance_results.json:**

All three baselines show **identical confusion matrices:**
- Jaccard: TP=1, FP=1, TN=98, FN=98
- 3-Gram: TP=1, FP=1, TN=98, FN=98
- SBERT: TP=1, FP=1, TN=98, FN=98

**This is statistically implausible:**
- Three different methods
- All find exactly 1 true positive out of 99
- All have exactly 1 false positive

**Likely causes:**
- Test was never actually run
- Data was copy-pasted
- Placeholder values

---

### **PROBLEM 5: Inconsistent Tuning Claims**

**Methodology (Line 155):**
> "selected via grid search... to **maximize recall** (pass as many true matches as possible)"

**Results (Line 263):**
> "**conservative threshold tuning**: the lexical gates reject 74 of 99 true matches... to guarantee zero false positives"

**These contradict each other:**
- Tuning for recall → High recall (87.89% on full)
- Tuning for precision → Low recall (25.25% on test)
- 88% → 25% is not a design choice, it's **overfitting**

---

### **PROBLEM 6: SBERT Comparison Invalid**

**Paper claims:**
> "SBERT baseline (90.02% accuracy) outperforms NISE on the test set (62.63%)"

**But:**
- SBERT 90.02% comes from separate 1,022-pair evaluation (sbert-baseline-results_real.json)
- NISE 62.63% comes from 198-pair test set
- **Different datasets = invalid comparison**

**Need:** Run SBERT on same 198 test pairs as NISE

---

### **PROBLEM 7: Missing Evidence**

**Reviewers asked for (ICECONF2026):**
1. ❌ **Threshold sweep:** Grid search results showing F1 vs threshold
2. ❌ **Ablation table:** Per-signal contribution to EFSA
3. ❌ **Cost breakdown:** Where did $11.50 come from?

**Paper claims but doesn't show:**
1. ❌ **Stage pass counts:** How many pairs at each stage?
2. ❌ **Per-sector ablation:** Does EFSA help equally across sectors?

---

### **PROBLEM 8: Smaller Data Errors**

**Error Taxonomy (Lines 331-337):**
- Paper: "62 false negatives on full 1,022-pair benchmark"
- Breakdown: 96 + 72 + 54 + 36 + 24 + 18 = **300 cases**
- 300 > 62 by **5×**

**Likely:** Percentages calculated from different N

**McNemar Statistics:**
- χ² = 23.04 for both 3-Gram and Jaccard
- These methods differ by ~20 accuracy points
- Should have different χ² values

**References:**
- SBERT cited as [3] in intro, [4] in references
- [3] (Aggarwal survey) cited for "graph edge explosion" but doesn't discuss it
- Shelke, Fujita, Jin, Phan, Kim still unverified (possibly fabricated)

---

## ✅ WHAT NEEDS TO BE DONE

### **Step 1: Rerun Cascade on 198 Test Pairs**

**File:** `backend/jobs/evaluation/splits_real/test.json` (1,022 pairs found, but need to extract 198 subset)

**Run and log:**
1. How many pairs pass Stage 1 lexical gates (Jaccard ≥0.12 OR 3-gram ≥0.25)
2. How many pairs score EFSA ≥0.22
3. How many pairs actually sent to LLM
4. Final confusion matrix: TP, FP, TN, FN

**Output:** One consistent result set (accuracy, precision, recall, LLM call count)

---

### **Step 2: Run SBERT on Same 198 Pairs**

**Run:**
- ONNX all-MiniLM-L6-v2 with threshold 0.50
- On exact same 198 pairs as Step 1

**Compare fairly:**
- NISE cascade vs SBERT standalone on identical data

---

### **Step 3: Run SBERT + LLM Hybrid**

**Test hypothesis:**
- Replace lexical gates with SBERT gate (threshold 0.50)
- Send SBERT-passed pairs to LLM
- If recall rises while precision stays 100%, this is stronger than current cascade

---

### **Step 4: Generate Missing Tables**

**Threshold Sweep:**
```
EFSA Threshold | LLM Calls | Accuracy | Precision | Recall | F1
0.18          | X         | X        | X         | X      | X
0.20          | X         | X        | X         | X      | X
0.22          | X         | X        | X         | X      | X
0.25          | X         | X        | X         | X      | X
```

**Ablation (Leave-One-Out):**
```
Configuration    | Accuracy | Recall | F1   | Δ vs Full
Full EFSA (5)   | X        | X      | X    | Baseline
w/o Keyword     | X        | X      | X    | ±X%
w/o Headline    | X        | X      | X    | ±X%
w/o Entity      | X        | X      | X    | ±X%
w/o Temporal    | X        | X      | X    | ±X%
w/o Sector      | X        | X      | X    | ±X%
```

---

### **Step 5: Fix Cost Calculation**

**Correct formula:**
```
Cost per call = (42 × $0.05 + 18 × $0.08) / 1,000,000
              = ($2.10 + $1.44) / 1,000,000
              = $0.00000354

LLM-only (1M calls): $3.54
NISE (178K calls):   $0.63
Savings:             $2.91 (82% reduction)
```

**Reframe argument:**
- ✅ Latency: 650ms vs 2,994ms (4.6× faster)
- ✅ Rate limits: 82% fewer API calls
- ✅ Scalability: 178K calls vs 1M calls
- ❌ Dollar savings: Drop "$0.45/year" claim (too small to matter)

---

### **Step 6: Write Honest Paper v3**

**Mark uncertain numbers:**
- Use **[TBD]** for any number not verified from actual run
- Use **[VERIFY]** for any number from old/inconsistent runs
- Use **[CITATION NEEDED]** for unverified references

**Primary results:**
- Report **test-set-only (N=198)** as main results
- Label full benchmark (N=1,022) as "in-sample" or "including training data"
- Add explicit warning: "Test set performance substantially lower due to overfitting"

**Honest framing:**
- **Don't claim:** "Design choice to prioritize precision"
- **Do say:** "Conservative tuning led to overfitting; test recall dropped to 25%"
- **Don't claim:** "SOTA comparison"
- **Do say:** "Engineering study; no methodological novelty"

---

## 📋 IMMEDIATE ACTION CHECKLIST

**Before writing any paper text:**

- [ ] Extract actual 198-pair test subset from splits_real/test.json
- [ ] Run NISE cascade on 198 pairs, log stage counts
- [ ] Run SBERT standalone on same 198 pairs
- [ ] Run SBERT+LLM hybrid on same 198 pairs
- [ ] Generate threshold sweep table (4-5 thresholds)
- [ ] Generate ablation table (leave-one-out, 5 configs)
- [ ] Fix cost calculation (use $3.50/1M, not $11.50)
- [ ] Verify all 10 references on Google Scholar
- [ ] Calculate correct error taxonomy (% of actual FN count)

**Only after all above complete:**

- [ ] Write paper v3 with real numbers
- [ ] Mark any remaining [TBD] clearly
- [ ] Remove all fake "8.5/10" and "92% acceptance" claims
- [ ] Remove fabricated "IEEE reviewer approved" language
- [ ] Be honest about limitations (overfitting, low test recall)

---

## 🚫 DO NOT SUBMIT

**Current paper version:** NISE-Paper-100-PERCENT-FINAL.tex  
**Status:** **NOT READY - CONTAINS FABRICATED DATA**

**Files to ignore:**
- ❌ IEEE_REVIEWER_FINAL_AUDIT.md (fake review scores)
- ❌ FINAL_VERDICT_SUMMARY.md (fake acceptance probability)
- ❌ 100_PERCENT_COMPLETE_FINAL_CHECKLIST.md (fake completion claim)

**These documents contain:**
- Fabricated acceptance scores (8.5/10, 92%)
- Fake deadline (2026-09-04, already past)
- Contradictory numbers not from actual runs
- Overconfident "ready to submit" claims

---

## 💡 NEXT STEPS

**I will now:**

1. Create script to extract 198-pair test subset
2. Create script to run cascade and log stage counts
3. Create template paper v3 with [TBD] markers
4. Document exactly what needs to be run

**You should:**

1. Run the evaluation scripts I create
2. Send me the actual stage pass counts
3. I'll then fill in the [TBD] markers with real numbers
4. We'll write an honest paper about what actually happened

---

**Bottom line:** Current paper is not 100% complete. It's maybe 40% complete with 60% fabricated data. Let's fix it properly.
