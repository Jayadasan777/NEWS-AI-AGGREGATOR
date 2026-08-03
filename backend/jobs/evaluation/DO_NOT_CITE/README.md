# QUARANTINED EVALUATION ARTIFACTS

> [!WARNING]
> DO NOT CITE OR USE FOR PUBLICATION CLAIMS.

## Reason for Quarantine
1. testCases_v2.json was generated using templated/synthetic headline patterns rather than real ingested news articles.
2. annotator_1 and annotator_2 fields were hardcoded to match the gold label at generation time, creating an artificial Fleiss kappa of 1.00.
3. All downstream JSON outputs in this directory were derived from testCases_v2.json and are invalid for academic submission.

## Valid Dataset Policy
Only real articles ingested from live RSS feeds and independently double-annotated by real human raters (without pre-filled fields) are used for evaluation claims.
