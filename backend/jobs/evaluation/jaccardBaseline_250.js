/**
 * Jaccard-Only Baseline Evaluation on N=250 Dataset
 * Simplest lexical baseline - no LLM calls, nearly instant
 * Threshold: 0.12 (same as production system)
 */

const fs = require('fs');
const path = require('path');

function simpleTokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function computeJaccard(str1, str2) {
  const t1 = new Set(simpleTokenize(str1));
  const t2 = new Set(simpleTokenize(str2));
  const intersection = new Set([...t1].filter(x => t2.has(x)));
  const union = new Set([...t1, ...t2]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function evaluateJaccardBaseline() {
  const candidatesPath = path.join(__dirname, 'candidate_sample_250.json');
  const labelsPath = path.join(__dirname, 'labels_annotator_A.json');

  if (!fs.existsSync(candidatesPath) || !fs.existsSync(labelsPath)) {
    console.error('❌ Error: Required files not found.');
    return;
  }

  const candidates = JSON.parse(fs.readFileSync(candidatesPath, 'utf8'));
  const labels = JSON.parse(fs.readFileSync(labelsPath, 'utf8'));

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 JACCARD-ONLY BASELINE EVALUATION (N=250 Dataset)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Dataset: candidate_sample_250.json`);
  console.log(`Ground Truth: labels_annotator_A.json`);
  console.log(`Total Pairs: ${candidates.length}`);
  console.log(`Threshold: τ = 0.12`);
  console.log('───────────────────────────────────────────────────────────');

  // Compute predictions
  let tp = 0, fp = 0, tn = 0, fn = 0;
  const threshold = 0.12;

  for (let i = 0; i < candidates.length; i++) {
    const pair = candidates[i];
    const label = labels[i];

    if (pair.id !== label.id) {
      console.error(`❌ ID mismatch at index ${i}: ${pair.id} vs ${label.id}`);
      return;
    }

    const jaccardScore = computeJaccard(pair.headline_a, pair.headline_b);
    const predicted = jaccardScore >= threshold ? 'SAME' : 'DIFFERENT';
    const actual = label.label;

    if (predicted === 'SAME' && actual === 'SAME') tp++;
    else if (predicted === 'SAME' && actual === 'DIFFERENT') fp++;
    else if (predicted === 'DIFFERENT' && actual === 'DIFFERENT') tn++;
    else if (predicted === 'DIFFERENT' && actual === 'SAME') fn++;
  }

  // Calculate metrics
  const total = tp + fp + tn + fn;
  const accuracy = (tp + tn) / total;
  const precision = (tp + fp) === 0 ? 0 : tp / (tp + fp);
  const recall = (tp + fn) === 0 ? 0 : tp / (tp + fn);
  const f1 = (precision + recall) === 0 ? 0 : 2 * (precision * recall) / (precision + recall);

  const mccDenom = Math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn));
  const mcc = mccDenom === 0 ? 0 : ((tp * tn) - (fp * fn)) / mccDenom;

  const results = {
    timestamp: new Date().toISOString(),
    dataset: 'candidate_sample_250.json',
    ground_truth: 'labels_annotator_A.json',
    sample_count: total,
    method: 'Jaccard-Only',
    threshold: threshold,
    confusion_matrix: { tp, fp, tn, fn },
    metrics: {
      accuracy: Number((accuracy * 100).toFixed(2)),
      precision: Number((precision * 100).toFixed(2)),
      recall: Number((recall * 100).toFixed(2)),
      f1: Number((f1 * 100).toFixed(2)),
      mcc: Number(mcc.toFixed(3))
    }
  };

  console.log('\n📊 RESULTS:');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`Confusion Matrix:`);
  console.log(`  True Positives (TP):  ${tp}`);
  console.log(`  False Positives (FP): ${fp}`);
  console.log(`  True Negatives (TN):  ${tn}`);
  console.log(`  False Negatives (FN): ${fn}`);
  console.log('───────────────────────────────────────────────────────────');
  console.log(`Metrics:`);
  console.log(`  Accuracy:  ${results.metrics.accuracy}%`);
  console.log(`  Precision: ${results.metrics.precision}%`);
  console.log(`  Recall:    ${results.metrics.recall}%`);
  console.log(`  F1 Score:  ${results.metrics.f1}%`);
  console.log(`  MCC:       ${results.metrics.mcc}`);
  console.log('═══════════════════════════════════════════════════════════');

  const outPath = path.join(__dirname, 'jaccard-baseline-results_250.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\n✅ Results saved to: ${outPath}`);

  return results;
}

if (require.main === module) {
  evaluateJaccardBaseline();
}

module.exports = { evaluateJaccardBaseline };
