/**
 * NISE paper-readiness audit (read-only).
 *
 * Run from repository root:
 *   node backend/jobs/evaluation/auditPaperReadiness.js
 *
 * This script does not run the LLM, change data, or modify production behavior.
 * It checks dataset/split provenance signals and arithmetic consistency in
 * result artifacts. Warnings are prompts for review, not automatic proof.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'paper_readiness_audit_report.json');

function readJson(relativePath) {
  const full = path.join(ROOT, relativePath);
  if (!fs.existsSync(full)) return { available: false, path: relativePath };
  try {
    const raw = fs.readFileSync(full, 'utf8');
    return {
      available: true,
      path: relativePath,
      raw,
      sha256: crypto.createHash('sha256').update(raw).digest('hex'),
      value: JSON.parse(raw),
    };
  } catch (error) {
    return { available: true, path: relativePath, error: error.message };
  }
}

function rowsFrom(value) {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.pairs)) return value.pairs;
  if (value && Array.isArray(value.test_cases)) return value.test_cases;
  return [];
}

function normalizedPair(row) {
  const a = String(row.headline_a ?? row.title_a ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  const b = String(row.headline_b ?? row.title_b ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!a || !b) return null;
  return [a, b].sort().join(' || ');
}

function labelOf(row) {
  const value = String(row.expected ?? row.label ?? row.gold_label ?? '').trim().toUpperCase();
  if (['SAME', 'TRUE', '1', 'MATCH'].includes(value)) return 'SAME';
  if (['DIFFERENT', 'FALSE', '0', 'NONMATCH', 'NON-MATCH'].includes(value)) return 'DIFFERENT';
  return null;
}

function summarizeDataset(name, loaded) {
  if (!loaded.available || loaded.error) {
    return { name, available: loaded.available, error: loaded.error ?? 'not found' };
  }
  const rows = rowsFrom(loaded.value);
  const labels = { SAME: 0, DIFFERENT: 0, unknown: 0 };
  const annotation = { bothPresent: 0, bothEqual: 0, annotatorDisagree: 0, oneOrBothMissing: 0 };
  const noteCounts = {};
  const ids = new Set();
  const pairs = new Set();
  let duplicatePairRows = 0;
  let suspiciousSyntheticNotes = 0;
  let rowsWithNotes = 0;

  for (const row of rows) {
    const label = labelOf(row);
    labels[label ?? 'unknown']++;
    if (row.annotator_1 && row.annotator_2) {
      annotation.bothPresent++;
      if (String(row.annotator_1).toUpperCase() === String(row.annotator_2).toUpperCase()) annotation.bothEqual++;
      else annotation.annotatorDisagree++;
    } else {
      annotation.oneOrBothMissing++;
    }
    if (row.id !== undefined) {
      if (ids.has(String(row.id))) noteCounts.duplicateIds = (noteCounts.duplicateIds ?? 0) + 1;
      ids.add(String(row.id));
    }
    const pair = normalizedPair(row);
    if (pair) {
      if (pairs.has(pair)) duplicatePairRows++;
      pairs.add(pair);
    }
    if (row.notes) {
      rowsWithNotes++;
      const note = String(row.notes);
      const key = note.slice(0, 80);
      noteCounts[key] = (noteCounts[key] ?? 0) + 1;
      if (/programmatic|structured|synthetic|template|generated|batch\s+\d+|case\s+s-\d+/i.test(note)) {
        suspiciousSyntheticNotes++;
      }
    }
  }

  return {
    name,
    path: loaded.path,
    sha256: loaded.sha256,
    count: rows.length,
    labels,
    annotation,
    uniqueIds: ids.size,
    duplicatePairRows,
    rowsWithNotes,
    suspiciousSyntheticNotes,
    topNotePatterns: Object.entries(noteCounts)
      .filter(([key]) => key !== 'duplicateIds')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([note, count]) => ({ note, count })),
  };
}

function metricsFromConfusion(tp, fp, tn, fn) {
  const n = tp + fp + tn + fn;
  const div = (a, b) => b === 0 ? null : a / b;
  const precision = div(tp, tp + fp);
  const recall = div(tp, tp + fn);
  const f1 = precision === null || recall === null || precision + recall === 0
    ? null : 2 * precision * recall / (precision + recall);
  return { n, accuracy: div(tp + tn, n), precision, recall, f1 };
}

function auditResultRows(loaded) {
  if (!loaded.available || loaded.error) {
    return { path: loaded.path, available: false, error: loaded.error ?? 'not found' };
  }
  const obj = loaded.value;
  const results = Array.isArray(obj.results) ? obj.results : [];
  const rows = results.map(row => {
    const tp = Number(row.tp);
    const fp = Number(row.fp);
    const tn = Number(row.tn);
    const fn = Number(row.fn);
    const hasConfusion = [tp, fp, tn, fn].every(Number.isFinite);
    return {
      configuration: row.configuration ?? row.name ?? 'unnamed',
      declaredN: row.total_n ?? row.n ?? obj.benchmark_size_N ?? null,
      computed: hasConfusion ? metricsFromConfusion(tp, fp, tn, fn) : null,
      reported: {
        accuracy: row.accuracy ?? null,
        precision: row.precision ?? null,
        recall: row.recall ?? null,
        f1: row.f1_score ?? row.f1 ?? null,
        callsSaved: row.calls_saved ?? row.call_reduction ?? null,
        latencyMs: row.latency_ms ?? null,
        costPerMillion: row.cost_per_1m ?? null,
      },
    };
  });
  return { path: loaded.path, available: true, sha256: loaded.sha256, benchmarkSize: obj.benchmark_size_N ?? null, rows };
}

function main() {
  const train = readJson('splits_real/train.json');
  const val = readJson('splits_real/val.json');
  const test = readJson('splits_real/test.json');
  const namedSplits = [
    summarizeDataset('train', train),
    summarizeDataset('validation', val),
    summarizeDataset('test', test),
  ];
  const splitPairSets = [train, val, test].map(file => new Set(rowsFrom(file.value).map(normalizedPair).filter(Boolean)));
  const overlaps = [];
  for (let i = 0; i < splitPairSets.length; i++) {
    for (let j = i + 1; j < splitPairSets.length; j++) {
      let overlapCount = 0;
      for (const pair of splitPairSets[i]) if (splitPairSets[j].has(pair)) overlapCount++;
      overlaps.push({ splitA: ['train', 'validation', 'test'][i], splitB: ['train', 'validation', 'test'][j], exactPairOverlap: overlapCount });
    }
  }

  const resultFiles = [
    'results_v2_final.json',
    'paper_evaluation_results.json',
    'sbert-full-evaluation.json',
    'statistical_significance_results.json',
    'iaa_report_real.json',
    'splits_real/split_report_real.json',
  ];
  const resultAudits = resultFiles.map(file => {
    const loaded = readJson(file);
    if (file === 'iaa_report_real.json' && loaded.available && !loaded.error) {
      return { path: file, available: true, sha256: loaded.sha256, iaa: loaded.value.cohen_kappa ?? null, dataset: loaded.value.dataset ?? null };
    }
    if (file === 'split_report_real.json' && loaded.available && !loaded.error) {
      return { path: file, available: true, sha256: loaded.sha256, splitReport: loaded.value };
    }
    return auditResultRows(loaded);
  });

  const allCounts = namedSplits.map(x => x.count).filter(Number.isFinite);
  const splitSummary = {
    counts: namedSplits.map(x => ({ split: x.name, count: x.count ?? null })),
    sum: allCounts.length === 3 ? allCounts.reduce((a, b) => a + b, 0) : null,
    pairOverlap: overlaps,
  };

  const report = {
    generatedAt: new Date().toISOString(),
    mode: 'read-only; no API calls; no file mutations except this report',
    datasetSplits: namedSplits,
    splitSummary,
    resultArtifacts: resultAudits,
    explicitCautions: [
      'Matching annotator fields do not prove independent annotation; verify original annotation procedure.',
      'Notes-based synthetic flags are heuristic indicators and must be reviewed against source provenance.',
      'Reported model metrics cannot be treated as comparable unless exact same pair IDs and labels were used.',
      'This audit checks arithmetic and artifact structure; it does not establish that labels are factually correct.',
      'No model/API experiment is executed by this script.',
    ],
  };

  fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log('NISE PAPER READINESS AUDIT');
  console.log('=========================');
  for (const dataset of namedSplits) {
    if (!Number.isFinite(dataset.count)) {
      console.log('- ' + dataset.name + ': unavailable (' + (dataset.error ?? 'unknown error') + ')');
      continue;
    }
    console.log('- ' + dataset.name + ': N=' + dataset.count +
      '; labels SAME=' + dataset.labels.SAME +
      ', DIFFERENT=' + dataset.labels.DIFFERENT +
      ', unknown=' + dataset.labels.unknown +
      '; possible synthetic-note flags=' + dataset.suspiciousSyntheticNotes +
      '; exact duplicate pair rows=' + dataset.duplicatePairRows);
  }
  console.log('- Split total: ' + (splitSummary.sum ?? 'unavailable'));
  for (const item of overlaps) console.log('- Exact pair overlap ' + item.splitA + '/' + item.splitB + ': ' + item.exactPairOverlap);
  console.log('- Wrote ' + path.relative(process.cwd(), OUT));
}

main();
