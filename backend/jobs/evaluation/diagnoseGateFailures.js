const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const fs = require('fs');
const {
  calculateJaccardSimilarity,
  calculateSemanticCosineSimilarity
} = require('../eventEngine');

const JACCARD_THRESHOLD = 0.12;
const COSINE_THRESHOLD = 0.25;

const runDiagnosis = () => {
  console.log('🚀 Running Stage 1 Gate Failure Diagnosis on SAME-labeled pairs...\n');

  const testCasesPath = path.join(__dirname, 'testCases.json');
  let testCases;
  try {
    testCases = JSON.parse(fs.readFileSync(testCasesPath, 'utf8'));
  } catch (err) {
    console.error('❌ Failed to read testCases.json:', err.message);
    return;
  }

  const samePairs = testCases.filter(tc => tc.expected === 'SAME');
  const failures = [];
  const passed = [];

  samePairs.forEach((tc, idx) => {
    const jaccard = calculateJaccardSimilarity(tc.headline_a, tc.headline_b);
    const cosine = calculateSemanticCosineSimilarity(tc.headline_a, tc.headline_b);

    const passesJaccard = jaccard >= JACCARD_THRESHOLD;
    const passesCosine = cosine >= COSINE_THRESHOLD;
    const passedGate = passesJaccard || passesCosine;

    const record = {
      pair_index: idx + 1,
      headline_a: tc.headline_a,
      headline_b: tc.headline_b,
      notes: tc.notes || '',
      jaccard_score: Number(jaccard.toFixed(4)),
      jaccard_required: JACCARD_THRESHOLD,
      jaccard_shortfall: Number(Math.max(0, JACCARD_THRESHOLD - jaccard).toFixed(4)),
      cosine_score: Number(cosine.toFixed(4)),
      cosine_required: COSINE_THRESHOLD,
      cosine_shortfall: Number(Math.max(0, COSINE_THRESHOLD - cosine).toFixed(4)),
      passed_gate: passedGate
    };

    if (passedGate) {
      passed.push(record);
    } else {
      // Assign categorization based on linguistic observation
      let category = 'Completely Different Vocabulary';
      const textA = tc.headline_a.toLowerCase();
      const textB = tc.headline_b.toLowerCase();

      if ((textA.includes('fed') && textB.includes('central bank')) || (textA.includes('ecb') && textB.includes('european central bank')) || (textA.includes('uk') && textB.includes('england'))) {
        category = 'Institutional Abbreviation vs Full Name';
      } else if (textA.match(/\d+/) && textB.match(/\d+/)) {
        category = 'Numerical / Financial Phrasing Variation';
      } else if ((textA.includes('un') && textB.includes('united nations')) || (textA.includes('fda') && textB.includes('us health regulators'))) {
        category = 'Acronym / Entity Name Variation';
      }

      record.failure_category = category;
      failures.push(record);
    }
  });

  const diagnosisOutput = {
    total_same_pairs: samePairs.length,
    total_gate_passed: passed.length,
    total_gate_failed: failures.length,
    failed_pairs: failures,
    passed_pairs: passed
  };

  const outputPath = path.join(__dirname, 'gate-failure-diagnosis.json');
  fs.writeFileSync(outputPath, JSON.stringify(diagnosisOutput, null, 2));
  console.log(`✅ Gate failure diagnosis saved to: ${outputPath}\n`);

  console.log(`📊 --- DIAGNOSIS SUMMARY ---`);
  console.log(`- Total SAME Pairs: ${samePairs.length}`);
  console.log(`- Gate Passed: ${passed.length}`);
  console.log(`- Gate Failed: ${failures.length}\n`);

  console.log(`### ❌ Failed Gate Pairs (11 Pairs)\n`);
  failures.forEach((f, i) => {
    console.log(`**Failure #${i + 1} (Category: ${f.failure_category})**`);
    console.log(`- Headline A: "${f.headline_a}"`);
    console.log(`- Headline B: "${f.headline_b}"`);
    console.log(`- Jaccard: ${f.jaccard_score} (Shortfall: -${f.jaccard_shortfall} vs ${JACCARD_THRESHOLD})`);
    console.log(`- Cosine:  ${f.cosine_score} (Shortfall: -${f.cosine_shortfall} vs ${COSINE_THRESHOLD})`);
    console.log(`- Notes: ${f.notes}\n`);
  });
};

runDiagnosis();
