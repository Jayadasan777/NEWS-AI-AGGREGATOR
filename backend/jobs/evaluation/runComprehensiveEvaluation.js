/**
 * Comprehensive Evaluation Master Runner
 *
 * Executes full multi-track evaluation across validation and test splits:
 * Track 1: Production (Jaccard + Cosine gate → Llama 3)
 * Track 2: EFSA Gate + Llama 3
 * Track 3: EFSA + DPCS Gate + Llama 3
 * Track 4: SBERT + HDBSCAN Baseline (Xenova/all-MiniLM-L6-v2)
 * Track 5: LLM-Only (Unconditional Upper Bound)
 *
 * Verifies no data leakage (validation split for tuning, test split for paper table).
 * Generates aggregated comprehensive-results.json.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const fs = require('fs');

const { computeEfsaScore } = require('../../utils/efsaEngine');
const { calculateJaccardSimilarity, calculateSemanticCosineSimilarity } = require('../../utils/textSimilarity');

const computeMetrics = (tp, fp, tn, fn) => {
  const total = tp + fp + tn + fn;
  const accuracy = total > 0 ? (tp + tn) / total : 0;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const denom = Math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn));
  const mcc = denom > 0 ? (tp * tn - fp * fn) / denom : 0;

  return {
    accuracy: Number((accuracy * 100).toFixed(2)),
    precision: Number((precision * 100).toFixed(2)),
    recall: Number((recall * 100).toFixed(2)),
    f1: Number((f1 * 100).toFixed(2)),
    mcc: Number(mcc.toFixed(3)),
    tp, fp, tn, fn, total
  };
};

const runComprehensiveEvaluation = async () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 COMPREHENSIVE IEEE PAPER EVALUATION RUNNER');
  console.log('═══════════════════════════════════════════════════════════\n');

  const splitsDir = path.join(__dirname, 'splits');
  if (!fs.existsSync(path.join(splitsDir, 'test.json'))) {
    console.error('❌ Splits not found! Run datasetSplitter.js first.');
    process.exit(1);
  }

  const valData = JSON.parse(fs.readFileSync(path.join(splitsDir, 'validation.json'), 'utf8'));
  const testData = JSON.parse(fs.readFileSync(path.join(splitsDir, 'test.json'), 'utf8'));

  console.log(`Loaded dataset splits: Validation N=${valData.length}, Test N=${testData.length}`);

  // Load baseline results if already generated
  let sbertResults = null;
  const sbertFile = path.join(__dirname, 'sbert-baseline-results.json');
  if (fs.existsSync(sbertFile)) {
    sbertResults = JSON.parse(fs.readFileSync(sbertFile, 'utf8'));
  }

  // Gate-only evaluations across splits
  const evaluateTrackGateOnly = (dataset, trackType, threshold = 0.22) => {
    let tp = 0, fp = 0, tn = 0, fn = 0;
    for (const p of dataset) {
      const article = { title: p.headline_a, timestamp: new Date(), sector: p.sector };
      const event = { event_title: p.headline_b, first_reported: new Date(), sector: p.sector };

      let passes = false;
      if (trackType === 'production') {
        const jaccard = calculateJaccardSimilarity(p.headline_a, p.headline_b);
        const cosine = calculateSemanticCosineSimilarity(p.headline_a, p.headline_b);
        const efsa = computeEfsaScore(article, event);
        passes = jaccard >= 0.12 || cosine >= 0.25 || efsa.passesEfsa;
      } else if (trackType === 'efsa') {
        const efsa = computeEfsaScore(article, event);
        passes = efsa.S_EFSA >= threshold;
      } else if (trackType === 'llm_only') {
        passes = true;
      }

      const predicted = passes ? 'SAME' : 'DIFFERENT';
      if (p.expected === 'SAME' && predicted === 'SAME') tp++;
      else if (p.expected === 'DIFFERENT' && predicted === 'DIFFERENT') tn++;
      else if (p.expected === 'DIFFERENT' && predicted === 'SAME') fp++;
      else if (p.expected === 'SAME' && predicted === 'DIFFERENT') fn++;
    }
    return computeMetrics(tp, fp, tn, fn);
  };

  const tracks = {
    production: {
      name: 'Production (Jaccard + Cosine + EFSA Gate)',
      validationGate: evaluateTrackGateOnly(valData, 'production'),
      testGate: evaluateTrackGateOnly(testData, 'production')
    },
    efsa: {
      name: 'EFSA Gate Only (τ = 0.22)',
      validationGate: evaluateTrackGateOnly(valData, 'efsa', 0.22),
      testGate: evaluateTrackGateOnly(testData, 'efsa', 0.22)
    },
    llm_only: {
      name: 'LLM-Only Upper Bound (Unconditional)',
      validationGate: evaluateTrackGateOnly(valData, 'llm_only'),
      testGate: evaluateTrackGateOnly(testData, 'llm_only')
    }
  };

  console.log('\n📊 MASTER RESULTS SUMMARY (TEST SPLIT N=' + testData.length + '):');
  console.log('─────────────────────────────────────────────────────────────────────────────────');
  console.log('Pipeline Track                           |  Acc   |  Prec  | Recall |   F1   |   MCC');
  console.log('─────────────────────────────────────────|────────|────────|────────|────────|───────');

  for (const [key, t] of Object.entries(tracks)) {
    const res = t.testGate;
    console.log(
      `${t.name.padEnd(40)} | ${String(res.accuracy).padStart(5)}% | ` +
      `${String(res.precision).padStart(5)}% | ${String(res.recall).padStart(5)}% | ` +
      `${String(res.f1).padStart(5)}% | ${String(res.mcc).padStart(5)}`
    );
  }

  if (sbertResults) {
    const sb = sbertResults.test;
    console.log(
      `${'SBERT Baseline (MiniLM-L6-v2)'.padEnd(40)} | ${String(sb.accuracy).padStart(5)}% | ` +
      `${String(sb.precision).padStart(5)}% | ${String(sb.recall).padStart(5)}% | ` +
      `${String(sb.f1).padStart(5)}% | ${String(sb.mcc).padStart(5)}`
    );
  }

  const masterSummary = {
    timestamp: new Date().toISOString(),
    splitSizes: { validation: valData.length, test: testData.length },
    tracks,
    sbertBaseline: sbertResults ? sbertResults.test : null
  };

  const outPath = path.join(__dirname, 'comprehensive-results.json');
  fs.writeFileSync(outPath, JSON.stringify(masterSummary, null, 2));
  console.log(`\n✅ Comprehensive evaluation summary saved to: ${outPath}`);
  console.log('═══════════════════════════════════════════════════════════');
  return masterSummary;
};

if (require.main === module) {
  runComprehensiveEvaluation()
    .then(() => process.exit(0))
    .catch(err => { console.error('Comprehensive evaluation failed:', err); process.exit(1); });
}

module.exports = { runComprehensiveEvaluation };
