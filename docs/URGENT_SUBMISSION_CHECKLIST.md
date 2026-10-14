# 🚨 URGENT: INERTCON2026 Submission Checklist

**Conference:** 2026 International Conference on Emerging Research and Technology (INERTCON2026)  
**Manuscript ID:** INERTCON2026-T1-0668  
**Original Deadline:** 2026-09-04  
**Current Date:** 2026-10-13  
**Status:** ⚠️ **39 DAYS OVERDUE** - SUBMIT IMMEDIATELY!

---

## ✅ COMPLETED WORK

### All Reviewer Comments Addressed:
1. ✅ **Threshold inconsistency fixed** (0.65 consistently used)
2. ✅ **DPCS demoted** from core contributions (empirical evidence added)
3. ✅ **EFSA ablation study added** (Table III with LOSO analysis)
4. ✅ **Numbering standardized** to IEEE format
5. ✅ **Pareto trade-off analysis added** (Table IV with parameter sweeps)
6. ✅ **Related Work restructured** into 3 thematic clusters
7. ✅ **Response to reviewers document prepared** (`RESPONSE_TO_REVIEWERS_INERTCON2026.md`)

---

## 📋 IMMEDIATE SUBMISSION STEPS

### Step 1: Compile LaTeX Document ⚠️
**Issue:** `pdflatex` not found in your system
**Solutions:**
- **Option A:** Use Overleaf
  1. Go to https://www.overleaf.com/
  2. Create new project → Upload `NISE-Paper.tex`
  3. Upload any figure files (fig1.png, fig2.png, fig3.png, fig4.png, fig5.png)
  4. Compile and download PDF
  
- **Option B:** Install LaTeX locally
  1. Windows: Install MiKTeX from https://miktex.org/
  2. Run: `pdflatex NISE-Paper.tex` (may need to run twice for references)
  3. Check for compilation errors
  
- **Option C:** Use online LaTeX compiler
  1. https://latexbase.com/
  2. Copy-paste your .tex content
  3. Compile and download

### Step 2: Visual Quality Check ✓
Before submission, verify the PDF:
- [ ] All tables render correctly (Tables I-IV)
- [ ] All figures appear (Fig. 1-5)
- [ ] No overfull/underfull hbox warnings affecting readability
- [ ] Equations formatted correctly
- [ ] References cited properly [1]-[N]
- [ ] Author information correct
- [ ] Page count within conference limits

### Step 3: Track Changes Version ✓
**Requirement:** "All revisions must be clearly indicated in the manuscript (using track changes or highlighted text)"

**Solutions:**
- **Option A:** Create annotated version with \usepackage{changes}
  ```latex
  \usepackage[final]{changes}
  \definechangesauthor[color=blue]{REV}
  % Wrap changed text with: \replaced[id=REV]{new text}{old text}
  ```

- **Option B:** Manually highlight in PDF
  1. Generate clean PDF
  2. Use PDF editor (Adobe, Foxit, etc.) to highlight changed sections
  3. Add margin notes referencing reviewer comments

- **Option C:** Submit both versions
  1. Clean version: `NISE-Paper-Revised-Clean.pdf`
  2. Tracked version: `NISE-Paper-Revised-Tracked.pdf`

**Key Changes to Highlight:**
- Section IV-F: Threshold correction (0.4 → 0.65)
- Abstract: DPCS removed from main claims
- Section I: DPCS demotion
- Section V-B: Table III (EFSA ablation) - NEW
- Section V-A: Table IV (Pareto sweep) - NEW  
- Section II: Complete restructure into 3 subsections
- All numbering: Decimal → IEEE Roman/Letter format

### Step 4: Prepare Response to Reviewers Document ✓
**Status:** ✅ Already completed in `RESPONSE_TO_REVIEWERS_INERTCON2026.md`

**Final Checks:**
- [ ] All 6 reviewer comments addressed point-by-point
- [ ] Specific line numbers/sections referenced for each change
- [ ] Professional tone maintained
- [ ] No defensive language
- [ ] Clear explanation of what was changed and why

### Step 5: Submit via Conference Portal 📤
**Submission Link:** https://ieeemas.scholarsubmit.com/conference/inertcon2026

**Required Files:**
1. **Revised Manuscript (PDF)** - Clean version
2. **Track Changes Version (PDF)** - Highlighted changes
3. **Response to Reviewers (PDF)** - Convert .md to PDF
4. **Source Files (Optional)** - .tex, figures, bibliography

**Submission Form Fields:**
- Manuscript ID: INERTCON2026-T1-0668
- Title: A Cost-Aware Multi-Stage Framework for Automated News Event Clustering and Social Media Distribution
- Authors: D. Menaga, Jayadasan S, Jason Peniel Raj S
- Keywords: Cost-aware AI, event clustering, large language models, news aggregation, semantic similarity
- Abstract: (copy from line 60-62 of .tex file)

### Step 6: Email Conference Chair (IMPORTANT) 📧
**To:** editor@scholarsubmit.com  
**CC:** Sreekanth R (Conference Chair)  
**Subject:** Late Submission of Revised Manuscript - INERTCON2026-T1-0668

**Email Template:**
```
Dear Dr. Sreekanth R and Technical Program Committee,

I am writing to submit the revised manuscript for Paper ID INERTCON2026-T1-0668 
titled "A Cost-Aware Multi-Stage Framework for Automated News Event Clustering 
and Social Media Distribution."

I sincerely apologize for the delay beyond the 2026-09-04 deadline. I have 
comprehensively addressed all reviewer comments as detailed in the attached 
point-by-point response document. 

Key revisions include:
• Resolution of the semantic similarity threshold inconsistency (R1-C1)
• Demotion and empirical evaluation of DPCS component (R1-C2)
• Addition of complete EFSA Leave-One-Signal-Out ablation study (R1-C3)
• Standardization of IEEE numbering conventions (R2-C1)
• Inclusion of parameter sensitivity and Pareto trade-off analysis (R2-C2)
• Thematic restructuring of Related Work section (R2-C3)

All changes are highlighted in the track-changes version for your review. 
I hope you will still consider this revised manuscript for inclusion in 
INERTCON 2026.

Thank you for your understanding and consideration.

Sincerely,
Jayadasan S
Department of Computer Science and Engineering
St. Joseph's Institute of Technology, Chennai, India
jayadasanjai@gmail.com
```

---

## ⏰ TIMELINE

### Immediate (Today):
- [ ] **Compile PDF** using Overleaf or online compiler
- [ ] **Visual check** all tables, figures, equations
- [ ] **Create track-changes version** with highlights
- [ ] **Convert response document to PDF**

### Within 24 Hours:
- [ ] **Upload to conference portal**
- [ ] **Send email to conference chair** with apology for delay
- [ ] **Save confirmation email/submission ID**

### Follow-up (48-72 hours):
- [ ] **Check email** for confirmation or questions
- [ ] **Be ready to clarify** any technical points
- [ ] **Prepare for potential re-revision** if late submission not accepted

---

## 🎯 POST-SUBMISSION PLAN

### If Accepted:
1. ✅ Register for conference
2. ✅ Prepare presentation slides
3. ✅ Book travel/accommodation
4. ✅ Prepare camera-ready version (final submission)

### If Late Submission Rejected:
**Plan B - Target Alternative Conferences:**

1. **IEEE/ACM Systems Conferences** (Good fit for NISE):
   - IEEE International Conference on Data Engineering (ICDE)
   - ACM Conference on Information and Knowledge Management (CIKM)
   - International Conference on Web Information Systems Engineering (WISE)
   - IEEE International Conference on Big Data

2. **AI/NLP Applications Conferences:**
   - AAAI Conference on Artificial Intelligence (Industrial Track)
   - International Conference on Computational Linguistics (COLING)
   - Conference on Empirical Methods in NLP (EMNLP - Industry Track)

3. **Regional/Domain-Specific Venues:**
   - International Conference on Recent Advances in Natural Language Processing (RANLP)
   - Pacific-Asia Conference on Knowledge Discovery and Data Mining (PAKDD)
   - IEEE International Conference on Semantic Computing (ICSC)

4. **Journal Submission** (Best long-term strategy):
   - IEEE Transactions on Knowledge and Data Engineering (TKDE)
   - ACM Transactions on Information Systems (TOIS)
   - Information Processing & Management (IP&M)
   - Expert Systems with Applications

### If Revision Requested Again:
- Address new comments with same thoroughness
- Use the comprehensive revision as a starting point
- Highlight improvements already made

---

## 📊 SUBMISSION PROBABILITY ASSESSMENT

### Factors in Your Favor:
✅ **Conditional acceptance** (not outright rejection)  
✅ **All technical issues resolved** comprehensively  
✅ **High-quality revisions** with empirical evidence  
✅ **Professional response document**  
✅ **Production system** (real-world value)  

### Concerns:
⚠️ **39 days overdue** - May violate hard deadline policy  
⚠️ **No prior communication** about delay  
⚠️ **Conference schedule** may be finalized  
⚠️ **Publication slot** may have been reassigned  

### Estimated Acceptance Probability:
- **If they accept late submissions:** 85-90% (excellent revisions)
- **If hard deadline enforced:** 0% (policy violation)
- **Overall realistic estimate:** 40-60%

### Risk Mitigation:
1. **Apologetic but professional tone** in email
2. **Highlight quality of revisions** (not just apology)
3. **Express strong interest** in presenting at conference
4. **Be prepared for Plan B** (other conferences)
5. **Don't be discouraged** - rejection reasons from other conferences were addressable

---

## 🔧 TECHNICAL FIXES STILL NEEDED (For Future Submissions)

### Critical for ICECONF-style Conferences:
1. **Threshold Selection Justification**
   - Add grid search results for Jaccard threshold (0.12)
   - Add sensitivity analysis for 3-gram threshold (0.25)
   - Show validation performance across parameter ranges

2. **Benchmark Construction Details**
   - Describe annotation protocol step-by-step
   - Specify annotator background/training
   - Explain positive pair generation methodology
   - Detail negative pair selection strategy

3. **State-of-the-Art Comparison**
   - Compare with TDT (Topic Detection & Tracking) methods
   - Compare with recent neural event clustering
   - Compare with commercial systems (if possible)

4. **Stage-Level Ablation**
   - Show what happens if Stage 1 is skipped
   - Quantify contribution of each stage to cost reduction
   - Test different stage orderings

5. **Reproducibility Section**
   - List all software versions (Python, PyTorch, etc.)
   - Detail API configuration (model params, temperature, etc.)
   - Provide hardware specs completely
   - Add code/data availability statement

### Medium Priority:
1. **Operational Cost Analysis**
   - Actual $ spent per day/month
   - GPU vs CPU cost comparison
   - Scalability projections (10K, 100K articles/day)

2. **Error Analysis Enhancement**
   - Confusion matrix for different error types
   - Examples of each error category
   - Suggestions for addressing each error type

### For ICCMN-style Venues:
1. **Reduce Mathematical Formalism**
   - Less emphasis on equations
   - More conceptual/architectural diagrams
   - Simpler notation

2. **Strengthen Novelty Argument**
   - Emphasize architectural innovation
   - Highlight production deployment challenges
   - Position as systems contribution clearly

---

## 💡 KEY LESSONS LEARNED

### What Worked:
- ✅ Thorough, point-by-point response addressing every comment
- ✅ Adding concrete empirical evidence (ablation tables)
- ✅ Quantifying trade-offs (Pareto analysis)
- ✅ Restructuring sections based on feedback

### What Could Be Improved:
- ⚠️ Meet deadlines (39-day delay is very problematic)
- ⚠️ Provide more methodological details upfront
- ⚠️ Include reproducibility section from the start
- ⚠️ Compare with existing methods, not just baselines

### Conference Selection Strategy:
- ✅ **Systems/Industrial conferences** value production experience
- ✅ **Applied AI tracks** appreciate cost-aware design
- ❌ **Pure research venues** expect novel algorithms
- ❌ **Theory-heavy conferences** want mathematical innovation

---

## 📞 CONTACT INFORMATION

**Conference Chair:** Sreekanth R  
**Email:** editor@scholarsubmit.com  
**Conference Portal:** https://ieeemas.scholarsubmit.com/conference/inertcon2026  
**Conference Website:** [Check for latest updates]

---

## 🎓 FINAL ENCOURAGEMENT

Your paper has **strong technical merit**:
- ✅ Real production system (1,450 articles/day)
- ✅ Strong empirical results (93.93% accuracy, 100% precision)
- ✅ Cost-aware design (82.2% reduction in LLM calls)
- ✅ Comprehensive evaluation (5,000-pair benchmark)
- ✅ All technical concerns addressed

The **late submission is the only risk factor**. Even if INERTCON2026 doesn't accept due to the delay, the paper is now in excellent shape for the next venue.

**Remember:**
- Many successful papers are rejected multiple times
- Each revision makes the paper stronger
- Production systems papers have real-world value
- Your contribution is meaningful and well-executed

**SUBMIT NOW and don't let the deadline worry paralyze you further!**

---

**Last Updated:** 2026-10-13  
**Next Action:** Compile PDF and submit within 24 hours
