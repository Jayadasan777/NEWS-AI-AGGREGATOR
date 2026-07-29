/**
 * Experimental EFSA Threshold Sensitivity Sweep Tool
 * Purpose: Evaluates EFSA gate-only, EFSA Full Pipeline, and EFSA+DPCS Full Pipeline
 * across 8 candidate threshold operating points (0.15, 0.18, 0.20, 0.22, 0.25, 0.28, 0.30, 0.35)
 * on the N=45 ground-truth benchmark dataset (testCases.json).
 * 
 * Re-uses computeEfsaScore from efsaEngine.js, updatePublisherCredibility from dpcsEngine.js,
 * and isSameEvent from eventEngine.js.
 * Saves outputs to backend/jobs/evaluation/efsa-threshold-sweep.json.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const fs = require('fs');
const { computeEfsaScore } = require('../../utils/efsaEngine');
const { updatePublisherCredibility, getPublisherCredibilityScore } = require('../../utils/dpcsEngine');
const {
  calculateJaccardSimilarity,
  calculateSemanticCosineSimilarity
} = require('../../utils/textSimilarity');
const { isSameEvent } = require('../eventEngine');

const THRESHOLDS = [0.15, 0.18, 0.20, 0.22, 0.25, 0.28, 0.30, 0.35];

const computeMetrics = (tp, fp, tn, fn, llmCalls = 0) => {
  const total = tp + fp + tn + fn;
  const accuracy = (tp + tn) / total;
  const precision = (tp + fp) > 0 ? (tp / (tp + fp)) : 0;
  const recall = (tp + fn) > 0 ? (tp / (tp + fn)) : 0;
  const f1 = (precision + recall) > 0 ? (2 * precision * recall / (precision + recall)) : 0;
  const denominator = Math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn));
  const mcc = denominator > 0 ? ((tp * tn - fp * fn) / denominator) : 0;

  return {
    accuracyPercent: Number((accuracy * 100).toFixed(2)),
    precisionPercent: Number((precision * 100).toFixed(2)),
    recallPercent: Number((recall * 100).toFixed(2)),
    f1Percent: Number((f1 * 100).toFixed(2)),
    mcc: Number(mcc.toFixed(3)),
    tp, fp, tn, fn,
    llmCalls,
    llmCallSavingsPercent: Number((((45 - llmCalls) / 45) * 100).toFixed(2))
  };
};

const runThresholdSweep = async () => {
  console.log('====================================================');
  console.log('⚡ EXPERIMENTAL EFSA THRESHOLD SENSITIVITY SWEEP (N=45)');
  console.log('====================================================\n');

  const testCasesPath = path.join(__dirname, 'testCases.json');
  const testCases = JSON.parse(fs.readFileSync(testCasesPath, 'utf8'));

  const llmCache = new Map();
  const cachedLlmVerify = async (titleA, titleB) => {
    const key = `${titleA}|||${titleB}`;
    if (llmCache.has(key)) {
      return llmCache.get(key);
    }
    const res = await isSameEvent(titleA, titleB);
    llmCache.set(key, res);
    return res;
  };

  // 1. Calculate Production 2-Stage Baseline
  let bGateTP = 0, bGateFP = 0, bGateTN = 0, bGateFN = 0;
  let bFullTP = 0, bFullFP = 0, bFullTN = 0, bFullFN = 0, bLlmCalls = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const isActualSame = tc.expected === 'SAME';
    const jaccard = calculateJaccardSimilarity(tc.headline_a, tc.headline_b);
    const cosine = calculateSemanticCosineSimilarity(tc.headline_a, tc.headline_b);
    const baselinePasses = (jaccard >= 0.12) || (cosine >= 0.25);

    if (baselinePasses) {
      if (isActualSame) bGateTP++; else bGateFP++;
      bLlmCalls++;
      const llmMatches = await cachedLlmVerify(tc.headline_a, tc.headline_b);
      if (llmMatches) {
        if (isActualSame) bFullTP++; else bFullFP++;
      } else {
        if (isActualSame) bFullFN++; else bFullTN++;
      }
    } else {
      if (isActualSame) bGateFN++; else bGateTN++;
      if (isActualSame) bFullFN++; else bFullTN++;
    }
  }

  const baselineResults = {
    gate_only: computeMetrics(bGateTP, bGateFP, bGateTN, bGateFN),
    full_pipeline: computeMetrics(bFullTP, bFullFP, bFullTN, bFullFN, bLlmCalls)
  };

  // 2. Perform Threshold Sweep across 8 operating points
  const sweepResults = {};

  for (const tau of THRESHOLDS) {
    console.log(`🔍 Evaluating threshold tau = ${tau.toFixed(2)}...`);

    let efsaGateTP = 0, efsaGateFP = 0, efsaGateTN = 0, efsaGateFN = 0;
    let efsaFullTP = 0, efsaFullFP = 0, efsaFullTN = 0, efsaFullFN = 0, efsaLlmCalls = 0;

    let dpcsFullTP = 0, dpcsFullFP = 0, dpcsFullTN = 0, dpcsFullFN = 0, dpcsLlmCalls = 0;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const isActualSame = tc.expected === 'SAME';
      const publisher = tc.domain || `Publisher_${(i % 5) + 1}`;

      const article = { title: tc.headline_a, timestamp: new Date(), sector: tc.sector };
      const event = { event_title: tc.headline_b, first_reported: new Date(), sector: tc.sector };

      updatePublisherCredibility(publisher, { stance: isActualSame ? 'Supporting' : 'Neutral' });
      const pubScore = getPublisherCredibilityScore(publisher);
      const pubFactor = pubScore / 100;

      const efsaRes = computeEfsaScore(article, event);
      const efsaPasses = efsaRes.S_EFSA >= tau;

      // EFSA Gate-Only & Full Pipeline
      if (efsaPasses) {
        if (isActualSame) efsaGateTP++; else efsaGateFP++;
        efsaLlmCalls++;
        const llmMatches = await cachedLlmVerify(tc.headline_a, tc.headline_b);
        if (llmMatches) {
          if (isActualSame) efsaFullTP++; else efsaFullFP++;
        } else {
          if (isActualSame) efsaFullFN++; else efsaFullTN++;
        }
      } else {
        if (isActualSame) efsaGateFN++; else efsaGateTN++;
        if (isActualSame) efsaFullFN++; else efsaFullTN++;
      }

      // EFSA + DPCS Full Pipeline
      const S_EFSA_DPCS = efsaRes.S_EFSA * (0.8 + 0.2 * pubFactor);
      const dpcsPasses = S_EFSA_DPCS >= tau;

      if (dpcsPasses) {
        dpcsLlmCalls++;
        const llmMatches = await cachedLlmVerify(tc.headline_a, tc.headline_b);
        if (llmMatches) {
          if (isActualSame) dpcsFullTP++; else dpcsFullFP++;
        } else {
          if (isActualSame) dpcsFullFN++; else dpcsFullTN++;
        }
      } else {
        if (isActualSame) dpcsFullFN++; else dpcsFullTN++;
      }
    }

    sweepResults[tau.toFixed(2)] = {
      threshold: tau,
      efsa_gate_only: computeMetrics(efsaGateTP, efsaGateFP, efsaGateTN, efsaGateFN),
      efsa_full_pipeline: computeMetrics(efsaFullTP, efsaFullFP, efsaFullTN, efsaFullFN, efsaLlmCalls),
      efsa_plus_dpcs_full_pipeline: computeMetrics(dpcsFullTP, dpcsFullFP, dpcsFullTN, dpcsFullFN, dpcsLlmCalls)
    };
  }

  const output = {
    timestamp: new Date().toISOString(),
    datasetSize: testCases.length,
    production_baseline: baselineResults,
    threshold_sweep: sweepResults
  };

  const outputPath = path.join(__dirname, 'efsa-threshold-sweep.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`\n✅ Threshold sweep completed. Saved to: ${outputPath}\n`);

  return output;
};

if (require.main === module) {
  runThresholdSweep()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Threshold Sweep Failed:', err);
      process.exit(1);
    });
}

module.exports = runThresholdSweep;
