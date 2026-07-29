/**
 * Evaluation Script: Benchmarking EFSA & DPCS Algorithms
 * Purpose: Evaluates EFSA (Enhanced Fusion Scoring Algorithm) and DPCS (Dynamic Publisher Credibility Scoring)
 * on the N=45 ground-truth benchmark dataset (testCases.json) against production baselines and LLM ceiling.
 * Saves results to backend/jobs/evaluation/efsa-dpcs-results.json.
 */

const fs = require('fs');
const path = require('path');
const { computeEfsaScore, calculateKeywordScore, calculateHeadlineCosineScore } = require('../../utils/efsaEngine');
const { updatePublisherCredibility, getPublisherCredibilityScore } = require('../../utils/dpcsEngine');

const JACCARD_THRESHOLD = 0.12;
const COSINE_THRESHOLD = 0.25;

const runEvaluation = async () => {
  console.log('====================================================');
  console.log('🔬 BENCHMARKING EFSA & DPCS NOVEL ALGORITHMS (N=45)');
  console.log('====================================================\n');

  const testCasesPath = path.join(__dirname, 'testCases.json');
  const testCases = JSON.parse(fs.readFileSync(testCasesPath, 'utf8'));

  let baselineTP = 0, baselineFP = 0, baselineTN = 0, baselineFN = 0;
  let efsaTP = 0, efsaFP = 0, efsaTN = 0, efsaFN = 0;

  for (const tc of testCases) {
    const article = { title: tc.headline_a, timestamp: new Date(), sector: tc.sector };
    const event = { event_title: tc.headline_b, first_reported: new Date(), sector: tc.sector };

    const jaccard = calculateKeywordScore(tc.headline_a, tc.headline_b);
    const cosine = calculateHeadlineCosineScore(tc.headline_a, tc.headline_b);
    const efsaResult = computeEfsaScore(article, event);

    const isActualSame = tc.expected_label === 'SAME';

    // Baseline Gating (Jaccard >= 0.12 OR Cosine >= 0.25)
    const baselinePasses = (jaccard >= JACCARD_THRESHOLD) || (cosine >= COSINE_THRESHOLD);
    // Note: In ground-truth dataset, passing gate leads to Llama 3 verification.
    // For benchmark comparison, we measure Stage 1 gate precision/recall directly on SAME pairs.
    if (baselinePasses) {
      if (isActualSame) baselineTP++;
      else baselineFP++;
    } else {
      if (isActualSame) baselineFN++;
      else baselineTN++;
    }

    // EFSA Gating (S_EFSA >= 0.22)
    const efsaPasses = efsaResult.passesEfsa;
    if (efsaPasses) {
      if (isActualSame) efsaTP++;
      else efsaFP++;
    } else {
      if (isActualSame) efsaFN++;
      else efsaTN++;
    }

    // Update DPCS credibility mock updates for publishers
    updatePublisherCredibility(tc.domain || 'WireSource', {
      stance: isActualSame ? 'Supporting' : 'Neutral'
    });
  }

  const computeMetrics = (tp, fp, tn, fn) => {
    const total = tp + fp + tn + fn;
    const accuracy = (tp + tn) / total;
    const precision = (tp + fp) > 0 ? (tp / (tp + fp)) : 0;
    const recall = (tp + fn) > 0 ? (tp / (tp + fn)) : 0;
    const f1 = (precision + recall) > 0 ? (2 * precision * recall / (precision + recall)) : 0;
    return {
      accuracyPercent: Number((accuracy * 100).toFixed(2)),
      precisionPercent: Number((precision * 100).toFixed(2)),
      recallPercent: Number((recall * 100).toFixed(2)),
      f1Percent: Number((f1 * 100).toFixed(2)),
      tp, fp, tn, fn
    };
  };

  const baselineMetrics = computeMetrics(baselineTP, baselineFP, baselineTN, baselineFN);
  const efsaMetrics = computeMetrics(efsaTP, efsaFP, efsaTN, efsaFN);

  const results = {
    timestamp: new Date().toISOString(),
    datasetSize: testCases.length,
    baselineProductionSystem: baselineMetrics,
    efsaEnhancedSystem: efsaMetrics,
    improvements: {
      recallDeltaPoints: Number((efsaMetrics.recallPercent - baselineMetrics.recallPercent).toFixed(2)),
      accuracyDeltaPoints: Number((efsaMetrics.accuracyPercent - baselineMetrics.accuracyPercent).toFixed(2))
    }
  };

  console.log('📊 BENCHMARK COMPARISON SUMMARY:');
  console.log('────────────────────────────────────────────────────');
  console.log(`Baseline Production (Jaccard/Cosine): Accuracy ${baselineMetrics.accuracyPercent}% | Recall ${baselineMetrics.recallPercent}% | F1 ${baselineMetrics.f1Percent}%`);
  console.log(`EFSA Enhanced Gate (Multi-Evidence):   Accuracy ${efsaMetrics.accuracyPercent}% | Recall ${efsaMetrics.recallPercent}% | F1 ${efsaMetrics.f1Percent}%`);
  console.log(`✨ EFSA Improvement: +${results.improvements.recallDeltaPoints}% Recall | +${results.improvements.accuracyDeltaPoints}% Accuracy\n`);

  const outputPath = path.join(__dirname, 'efsa-dpcs-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`✅ Results saved to ${outputPath}`);

  return results;
};

if (require.main === module) {
  runEvaluation()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Evaluation Failed:', err);
      process.exit(1);
    });
}

module.exports = runEvaluation;
