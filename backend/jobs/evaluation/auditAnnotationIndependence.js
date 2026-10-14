/**
 * Audit existing two-annotator label files without treating file names as proof
 * of independent annotation. This is descriptive validation only.
 *
 * Run from repository root:
 *   node backend/jobs/evaluation/auditAnnotationIndependence.js
 *
 * The report intentionally does not certify independence or adjudicate labels.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DIR = __dirname;
const A_PATH = path.join(DIR, 'labels_annotator_A.json');
const B_PATH = path.join(DIR, 'labels_annotator_B.json');
const OUT = path.join(DIR, 'annotation_independence_audit.json');
const VALID = new Set(['SAME', 'DIFFERENT']);

function read(file) {
  const raw = fs.readFileSync(file, 'utf8');
  return {
    raw,
    sha256: crypto.createHash('sha256').update(raw).digest('hex'),
    rows: JSON.parse(raw),
  };
}
function normalized(s) {
  return String(s || '').trim().replace(/\\s+/g, ' ').toLowerCase();
}
function pairKey(row) {
  const a = normalized(row.headline_a);
  const b = normalized(row.headline_b);
  return [a, b].sort().join(' || ');
}
function safeRate(n, d) { return d ? n / d : null; }

const A = read(A_PATH);
const B = read(B_PATH);
const byA = new Map(A.rows.map(r => [String(r.id), r]));
const byB = new Map(B.rows.map(r => [String(r.id), r]));
const idsA = new Set(byA.keys());
const idsB = new Set(byB.keys());
const common = [...idsA].filter(id => idsB.has(id));
const missingInB = [...idsA].filter(id => !idsB.has(id));
const missingInA = [...idsB].filter(id => !idsA.has(id));

let exactPairMatch = 0;
let validLabelPairs = 0;
let agreement = 0;
let aSame = 0, aDiff = 0, bSame = 0, bDiff = 0;
let sameSame = 0, sameDiff = 0, diffSame = 0, diffDiff = 0;
let labelMismatches = 0;
const pairMismatchIds = [];
const invalidLabelIds = [];
for (const id of common) {
  const a = byA.get(id), b = byB.get(id);
  if (normalized(a.headline_a) === normalized(b.headline_a) &&
      normalized(a.headline_b) === normalized(b.headline_b)) exactPairMatch++;
  else pairMismatchIds.push(id);

  if (!VALID.has(a.label) || !VALID.has(b.label)) {
    invalidLabelIds.push(id);
    continue;
  }
  validLabelPairs++;
  if (a.label === 'SAME') aSame++; else aDiff++;
  if (b.label === 'SAME') bSame++; else bDiff++;
  if (a.label === b.label) agreement++; else labelMismatches++;
  if (a.label === 'SAME' && b.label === 'SAME') sameSame++;
  if (a.label === 'SAME' && b.label === 'DIFFERENT') sameDiff++;
  if (a.label === 'DIFFERENT' && b.label === 'SAME') diffSame++;
  if (a.label === 'DIFFERENT' && b.label === 'DIFFERENT') diffDiff++;
}
const po = safeRate(agreement, validLabelPairs);
const pe = validLabelPairs
  ? ((aSame / validLabelPairs) * (bSame / validLabelPairs)) +
    ((aDiff / validLabelPairs) * (bDiff / validLabelPairs))
  : null;
const kappa = pe === null || pe === 1 ? null : (po - pe) / (1 - pe);

const duplicateCountsA = new Map(), duplicateCountsB = new Map();
for (const r of A.rows) duplicateCountsA.set(pairKey(r), (duplicateCountsA.get(pairKey(r)) || 0) + 1);
for (const r of B.rows) duplicateCountsB.set(pairKey(r), (duplicateCountsB.get(pairKey(r)) || 0) + 1);
const report = {
  generated_at: new Date().toISOString(),
  purpose: 'Descriptive schema, pair alignment, agreement, and duplicate-pair audit',
  inputs: {
    annotator_A: { path: path.basename(A_PATH), sha256: A.sha256, rows: A.rows.length },
    annotator_B: { path: path.basename(B_PATH), sha256: B.sha256, rows: B.rows.length },
  },
  alignment: {
    common_ids: common.length,
    ids_missing_from_B: missingInB,
    ids_missing_from_A: missingInA,
    same_headline_pair_for_common_ids: exactPairMatch,
    mismatched_headline_pair_ids: pairMismatchIds,
    identical_file_bytes: A.sha256 === B.sha256,
  },
  label_agreement_on_valid_common_rows: {
    n: validLabelPairs,
    invalid_label_ids: invalidLabelIds,
    observed_agreement: po,
    cohen_kappa: kappa,
    disagreements: labelMismatches,
    confusion: { same_same: sameSame, same_different: sameDiff, different_same: diffSame, different_different: diffDiff },
  },
  duplicate_pairs: {
    distinct_normalized_pairs_A: duplicateCountsA.size,
    duplicate_excess_rows_A: A.rows.length - duplicateCountsA.size,
    distinct_normalized_pairs_B: duplicateCountsB.size,
    duplicate_excess_rows_B: B.rows.length - duplicateCountsB.size,
  },
  interpretation_limits: [
    'Different files or labels do not prove that annotation was independent or blind.',
    'Agreement statistics are descriptive and do not validate label correctness.',
    'This script does not establish the provenance of source headlines or adjudicate disputed labels.',
    'Do not use this report as evidence of full-dataset human annotation unless the annotation protocol and audit trail independently establish that fact.'
  ],
};
fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\\n');
console.log(JSON.stringify({
  report: path.relative(process.cwd(), OUT),
  nA: A.rows.length,
  nB: B.rows.length,
  commonIds: common.length,
  alignedHeadlinePairs: exactPairMatch,
  validLabelPairs,
  observedAgreement: po,
  cohenKappa: kappa,
  disagreements: labelMismatches,
  duplicateExcessRowsA: report.duplicate_pairs.duplicate_excess_rows_A,
  duplicateExcessRowsB: report.duplicate_pairs.duplicate_excess_rows_B,
  interpretation: 'Descriptive audit only; not proof of independent annotation.'
}, null, 2));
