# NISE Evidence Audit — Follow-up Findings

This follow-up adds independently checked details from the evaluation artifacts on `research/paper-evidence-audit`. It supplements `docs/NISE_EVIDENCE_AUDIT_WORKING.md`; it does not change the production code or manuscript.

## F8 — Multiple incompatible “198-pair test” results exist

The manuscript's Table I describes a balanced held-out test set with 99 positive and 99 negative pairs and the NISE confusion matrix TP=25, FP=0, TN=99, FN=74.

However, `backend/jobs/evaluation/results_v2_final.json` contains a separate 198-pair result suite where the lexical baselines report TP=1, FP=1, TN=98, FN=98, and its NISE-like results vary across configurations. `backend/jobs/evaluation/statistical_significance_results.json` also reports N=198 and the same very-low lexical baseline scores. A separate `paper_evaluation_results.json` declares 157 positive and 41 negative test pairs (N=198) and reports a simulated-perfect LLM classifier. Meanwhile, the manuscript's claimed balanced test composition requires 99 positive and 99 negative pairs.

**Conclusion:** The number “198” is not enough to identify a unique benchmark. Each reported row needs a provenance key tying it to an exact dataset file hash, split hash, code revision, configuration, and saved prediction file. Do not combine metrics from these different artifacts in one comparison table.

## F9 — The 5,000-pair split contains programmatically generated examples

The checked `backend/jobs/evaluation/splits_real/val.json` and `test.json` contain records with fields such as `Case S-126`, `Case S-1456`, and notes including `Programmatic multi-domain extension`. For these records, `annotator_1` and `annotator_2` are both populated with the same `expected` label. This does not demonstrate independent annotation of these examples.

The 5,000-item split report is a valid record of split sizes (2,990 / 988 / 1,022), but the filename `splits_real` and the metadata name `real` are not sufficient to establish that every example is a real, independently labeled RSS pair. Dataset provenance must be established at the record level or with source-backed construction documentation.

**Required repair:** Quantify the proportion of real RSS-derived pairs, templated/synthetic pairs, and independently human-labeled pairs. Either exclude synthetic examples from headline test metrics or report synthetic stress-test results separately. Do not describe the entire 5,000-pair corpus as real RSS data unless the records support that description.

## F10 — The 100% LLM reference conflicts with the evaluation code's simulation/extrapolation modes

`backend/jobs/evaluation/paper_evaluation_results.json` states in metadata that LLM calls were “simulated as perfect classifier (ground truth) for stage pass count analysis.” Its LLM-only row therefore represents an idealized oracle, not observed LLM model performance. Separately, `llmOnlyCeiling.js` defaults to `useActual = false`, explicitly distinguishes extrapolation from actual API calls, and hard-codes a 2,994 ms latency value from previous runs.

The manuscript's footnote says a zero-shot Llama 3.1-8B model actually evaluated all 198 pairs and matched consensus labels. That claim requires a distinct artifact containing each actual LLM response, prediction, error/retry behavior, model identifier, prompt version, and comparison against independently adjudicated labels. The currently checked simulation/extrapolation artifacts do not prove that run occurred.

**Required repair:** Until an actual per-pair output artifact is found, remove the claim that the 100% row is a measured LLM result. It may be shown only as an explicitly labeled oracle/perfect-classifier reference, not as an empirical LLM baseline.

## F11 — The production default model is not the model named in the manuscript

At the checked source revision, `backend/jobs/eventEngine.js` sets the default `GROQ_MODEL` to `openai/gpt-oss-120b`; `backend/utils/aiTelemetry.js` independently defines a default model of `llama-3.3-70b-versatile`; the manuscript identifies Llama 3.1-8B-Instant. Environment configuration may override defaults, but no checked deployment manifest or telemetry export establishes which value was active during the claimed benchmark or production window.

**Required repair:** Identify the model used for each experiment from captured run metadata. If the exact production environment value cannot be recovered, state that the deployed model cannot be independently verified from the repository snapshot and avoid asserting a specific model for that telemetry period.

## F12 — The held-out comparison table appears to merge results from incompatible experimental runs

The manuscript combines a balanced N=198 NISE confusion matrix (25/0/99/74), a 90.0% SBERT row, and a 100% exhaustive LLM reference. The checked SBERT artifact contains results at N=198 but its threshold-0.50 held-out row is not 90.0% accuracy; it reports the threshold grid separately. Another SBERT artifact reports 90.02% accuracy on N=1,022. The checked LLM reference artifact is simulation/extrapolation rather than a measured run. This means the current comparison table cannot yet be reproduced from one consistent test set.

**Required repair:** Build a fresh results table only after all methods are evaluated against the same immutable held-out records. Store the exact pair IDs and predictions for each method. Threshold selection must use validation data only, and all reported held-out metrics must be computed from the frozen test predictions.

## Next execution gate

Before editing result numbers in the paper, produce a signed-off experiment manifest containing:
- canonical dataset filename and SHA-256;
- dataset provenance and annotation policy;
- train/validation/test pair IDs and hashes;
- exact source commit and uncommitted-diff status;
- threshold/model/prompt configuration for each method;
- per-pair gold label and per-method prediction;
- stage-by-stage candidate and LLM-call trace;
- latency sample definition and raw samples;
- token usage and pricing assumptions;
- metric script and its output.

If any of these cannot be recovered for an existing reported result, rerun the experiment or remove/qualify the claim. A reproducible, modest result is stronger than an impressive but unauditable number.
