# NISE Conference Submission Readiness Checklist

**Status: NOT READY FOR SUBMISSION — empirical evidence and venue compliance remain open.**

This checklist is based on the repository audit on branch `research/paper-evidence-audit`. It does not certify the correctness of the benchmark labels or the deployed runtime configuration.

## What has been prepared

- A working audit branch separate from `main`; production source and `main` were not changed.
- `docs/NISE_EVIDENCE_AUDIT_WORKING.md` and `docs/NISE_EVIDENCE_AUDIT_FOLLOWUP.md`: recorded evidence blockers.
- `backend/jobs/evaluation/auditPaperReadiness.js`: read-only dataset/result artifact audit utility; it has not been executed in this environment.
- `docs/NISE-Paper-v3-AUDIT-DRAFT.tex`: an implementation-aligned working draft. It deliberately withholds unsupported quantitative claims; it is **not yet a submission-ready empirical paper**.

## Evidence blockers that must be closed

- [ ] Freeze one benchmark and publish its SHA-256 hash, split IDs, class counts, collection dates, and source provenance.
- [ ] Remove programmatically generated/template pairs from the primary test set, or clearly label them as a separate synthetic stress test.
- [ ] Obtain independent human labels for each retained pair, record each annotator separately, adjudicate disagreements, and calculate inter-annotator agreement on that exact dataset.
- [ ] Ensure train/validation/test splits are pair-disjoint and, where feasible, event-disjoint to reduce leakage.
- [ ] Freeze the implementation commit, model ID, prompt, thresholds, environment configuration, and dependency lockfile before the final run.
- [ ] Implement an evaluation runner that executes the **actual code path** over every fixed test pair and stores one prediction per pair, stage decisions, and errors. Do not use simulated or oracle LLM predictions as measured model results.
- [ ] Run all baselines on exactly the same pairs and labels. At minimum include Jaccard-only, character 3-gram-only, EFSA gate-only, the actual candidate gate + actual LLM verifier, and a relevant semantic baseline if it can be run reproducibly.
- [ ] Record actual LLM requests/responses, selected model ID, token usage, failures/retries, call counts, wall-clock boundaries, hardware/runtime details, and the price schedule used for cost calculations.
- [ ] Report confusion matrices, precision, recall, F1, accuracy, MCC, 95% confidence intervals, and class balance. Describe zero observed false positives as an observation on the evaluated sample, not a guarantee.
- [ ] Measure latency with a clear boundary: per-similarity evaluation, LLM round trip, or end-to-end article processing. Do not mix them in one comparison.
- [ ] Recalculate call reduction from actual stage traces; do not derive it from an unexecuted template or from a simulated LLM ceiling.
- [ ] Run an ablation using the same frozen split and same evaluation implementation. Use paired statistical tests only when the required paired predictions exist.
- [ ] Verify every bibliography entry against its publisher or official proceedings record and check every in-text citation.
- [ ] Compile with the target IEEE conference template, inspect all warnings, verify figure/table legibility, and confirm the page limit.
- [ ] Apply the selected conference's specific rules for anonymous review, author blocks, supplementary material, AI-use disclosure, copyright, and submission system.

## Required experiment artifact bundle

Save these together under a versioned directory and commit or archive the exact files used for the final paper:

1. `dataset_manifest.json`: dataset ID, pair IDs, source URLs/identifiers, dates, labels, annotator labels, adjudication, and split.
2. `dataset_sha256.txt`: hash of the frozen dataset and each split file.
3. `experiment_config.json`: code commit, model identifier, prompt hash, thresholds, weights, package versions, and runtime/hardware.
4. `predictions.jsonl`: one row per pair with gold label, prediction, gate scores, whether the LLM was called, raw response or normalized decision, latency, token counts, and error state.
5. `metrics.json`: confusion matrices, derived metrics, confidence intervals, and call/cost calculations generated from the prediction file.
6. `run.log`: exact command, timestamps, exit status, and reproducible environment details.

## Publication decision rule

Do not restore the previous 82.3% call-reduction, 100% observed-precision, 642 ms latency, 90% SBERT accuracy, or cost claims unless the exact supporting experiment, pair IDs, model/configuration, and logs are identified and reproducible. If evidence cannot be recovered, rerun the experiment and update the paper from the new artifacts.

The current production implementation uses an OR-connected candidate gate: Jaccard threshold, character 3-gram cosine threshold, **or** EFSA threshold can trigger the LLM. The inspected event-matching path does not invoke the offline SBERT evaluator. The manuscript and diagrams must remain consistent with that behavior unless the code is deliberately changed in a separate, reviewed change.
