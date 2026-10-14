# NISE Conference Submission Packet — Provisional SIGIR 2027

**Status: FORMAT DRAFT READY FOR VALIDATION; SCIENTIFIC SUBMISSION BLOCKED**

This packet keeps production code untouched and all paper changes on `research/paper-evidence-audit`.

## Current manuscript artifacts

- IEEE working manuscript: `docs/NISE-Paper-v3-AUDIT-DRAFT.tex`
- Anonymous ACM/SIGIR-format copy: `docs/NISE-SIGIR2027-ANON.tex`
- Benchmark audit utility: `backend/jobs/evaluation/auditPaperReadiness.js`
- Venue shortlist and deadline evidence: `docs/NISE_CONFERENCE_TARGETING_MATRIX.md`
- Build and audit workflow: `.github/workflows/nise-paper-validation.yml`

## Provisional venue decision

SIGIR 2027 is a **candidate, not a confirmed target**. Its official full-paper call lists proposed abstract and paper deadlines of 14 January 2027 and 21 January 2027. The full-paper track expects high-impact original IR research, requires anonymous ACM-format PDF, ACM CCS concepts, OpenReview profiles, and forbids concurrent submission. The call also says the full paper cannot be submitted without a previously submitted abstract. Short, demo, resource, reproducibility, and perspective track calls were not yet published in the venue information checked on 14 October 2026. Recheck the official call before committing to a track.

Official call: https://sigir2027.org/pages/submit-full.html

## Mandatory scientific blockers

1. The 5,000-record split contains 4,755 rows flagged by a notes-pattern heuristic as potentially programmatic or structured extensions. This is a heuristic signal, not proof that every flagged row is synthetic.
2. Both annotation fields match for all rows, but the repository does not establish that two independent people labeled them.
3. The 198-pair result and the 5,000-record split do not constitute one consistent experiment; some LLM results are explicitly simulated.
4. The cascade script inspected does not execute the complete pipeline and does not provide per-pair model traces.
5. Actual deployed model identity, per-pair decisions, API token usage, stage counts, and end-to-end latency remain unverified.

Do not replace these blockers with generated labels or fabricated model runs. The paper can describe the audit now, but any comparative claims require an independently adjudicated benchmark and a genuine rerun.

## Before any submission

- [ ] Review and approve the final author list and author order with every co-author.
- [ ] Confirm the intended venue/track and latest official deadline.
- [ ] Freeze dataset IDs, sources, labels, and hashes; obtain independent labels and adjudication.
- [ ] Run the actual production decision path and all baselines on identical frozen pairs.
- [ ] Archive per-pair predictions, real LLM responses, stage traces, model ID, token counts, timings, code revision, and config.
- [ ] Recompute metrics and costs from the archived evidence; remove any unsupported claims.
- [ ] Recompile the anonymous manuscript and verify the PDF visually, page count, font embedding, references, table/figure readability, and anonymity.
- [ ] Verify every citation and all venue-specific disclosure, AI-use, ethics, and artifact policies.
- [ ] Ensure all authors have complete OpenReview profiles before the abstract deadline.
- [ ] Submit to one venue only where required; do not submit concurrently to incompatible tracks.

## Decision

**Do not submit the current copy yet.** The format copy and validation automation are preparation steps; they do not validate the experimental evidence or guarantee venue fit.
