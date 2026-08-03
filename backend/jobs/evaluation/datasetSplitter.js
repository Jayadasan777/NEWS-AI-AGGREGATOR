/**
 * Dataset Splitter: Deterministic 60/20/20 Stratified Train/Validation/Test Split
 * 
 * Reviewer Requirement (Tier 1 Critical):
 * - "Tune τ_sem on validation set only, report test results separately"  
 * - "No data leakage — threshold tuning must not touch test split"
 * 
 * Strategy: Stratified by (expected × difficulty) bucket using seeded shuffle
 * to ensure reproducible, balanced splits across all runs.
 */

const fs = require('fs');
const path = require('path');

// Seeded pseudo-random number generator (Mulberry32) for reproducibility
const seededRng = (seed) => {
  let s = seed;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const RANDOM_SEED = 42; // Fixed seed — must never change for reproducibility
const TRAIN_RATIO = 0.60;
const VAL_RATIO   = 0.20;
// TEST_RATIO = 0.20 (remainder)

const splitDataset = (inputPath, outputDir) => {
  const rng = seededRng(RANDOM_SEED);

  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

  // Stratify by expected × difficulty to ensure balanced splits
  const strataBuckets = {};
  for (const pair of data) {
    const key = `${pair.expected}__${pair.difficulty || 'medium'}`;
    if (!strataBuckets[key]) strataBuckets[key] = [];
    strataBuckets[key].push(pair);
  }

  // Shuffle each stratum deterministically
  for (const key of Object.keys(strataBuckets)) {
    const arr = strataBuckets[key];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  const train = [], validation = [], test = [];

  // Split each stratum proportionally
  for (const [key, arr] of Object.entries(strataBuckets)) {
    const n = arr.length;
    const nTrain = Math.round(n * TRAIN_RATIO);
    const nVal   = Math.round(n * VAL_RATIO);
    // nTest = remainder

    train.push(...arr.slice(0, nTrain));
    validation.push(...arr.slice(nTrain, nTrain + nVal));
    test.push(...arr.slice(nTrain + nVal));
  }

  // Final shuffle of each split (deterministic)
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const finalTrain      = shuffle(train);
  const finalValidation = shuffle(validation);
  const finalTest       = shuffle(test);

  // Add split field to each record
  finalTrain.forEach(p => { p.split = 'train'; });
  finalValidation.forEach(p => { p.split = 'validation'; });
  finalTest.forEach(p => { p.split = 'test'; });

  // Write splits
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'train.json'), JSON.stringify(finalTrain, null, 2));
  fs.writeFileSync(path.join(outputDir, 'validation.json'), JSON.stringify(finalValidation, null, 2));
  fs.writeFileSync(path.join(outputDir, 'test.json'), JSON.stringify(finalTest, null, 2));

  // Leakage check: ensure no pair_id appears in multiple splits
  const trainIds = new Set(finalTrain.map(p => p.id));
  const valIds   = new Set(finalValidation.map(p => p.id));
  const testIds  = new Set(finalTest.map(p => p.id));

  const leakTrainVal  = [...trainIds].filter(id => valIds.has(id));
  const leakTrainTest = [...trainIds].filter(id => testIds.has(id));
  const leakValTest   = [...valIds].filter(id => testIds.has(id));

  const hasLeakage = leakTrainVal.length > 0 || leakTrainTest.length > 0 || leakValTest.length > 0;

  // Produce detailed report
  const report = {
    seed: RANDOM_SEED,
    ratios: { train: TRAIN_RATIO, validation: VAL_RATIO, test: 1 - TRAIN_RATIO - VAL_RATIO },
    total: data.length,
    splits: {
      train: {
        n: finalTrain.length,
        SAME:      finalTrain.filter(p => p.expected === 'SAME').length,
        DIFFERENT: finalTrain.filter(p => p.expected === 'DIFFERENT').length,
        easy:   finalTrain.filter(p => p.difficulty === 'easy').length,
        medium: finalTrain.filter(p => p.difficulty === 'medium').length,
        hard:   finalTrain.filter(p => p.difficulty === 'hard').length,
      },
      validation: {
        n: finalValidation.length,
        SAME:      finalValidation.filter(p => p.expected === 'SAME').length,
        DIFFERENT: finalValidation.filter(p => p.expected === 'DIFFERENT').length,
        easy:   finalValidation.filter(p => p.difficulty === 'easy').length,
        medium: finalValidation.filter(p => p.difficulty === 'medium').length,
        hard:   finalValidation.filter(p => p.difficulty === 'hard').length,
      },
      test: {
        n: finalTest.length,
        SAME:      finalTest.filter(p => p.expected === 'SAME').length,
        DIFFERENT: finalTest.filter(p => p.expected === 'DIFFERENT').length,
        easy:   finalTest.filter(p => p.difficulty === 'easy').length,
        medium: finalTest.filter(p => p.difficulty === 'medium').length,
        hard:   finalTest.filter(p => p.difficulty === 'hard').length,
      },
    },
    leakage_check: {
      passed: !hasLeakage,
      train_val_overlap:  leakTrainVal.length,
      train_test_overlap: leakTrainTest.length,
      val_test_overlap:   leakValTest.length,
    }
  };

  fs.writeFileSync(path.join(outputDir, 'split_report.json'), JSON.stringify(report, null, 2));

  // Console output
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 DATASET SPLIT REPORT (Seed: ' + RANDOM_SEED + ')');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total pairs: ${data.length}`);
  console.log('');
  const fmtSplit = (name, s) => {
    console.log(`${name.padEnd(12)} N=${String(s.n).padStart(4)}  |  SAME=${String(s.SAME).padStart(3)}  DIFF=${String(s.DIFFERENT).padStart(3)}  |  easy=${s.easy} med=${s.medium} hard=${s.hard}`);
  };
  fmtSplit('TRAIN',      report.splits.train);
  fmtSplit('VALIDATION', report.splits.validation);
  fmtSplit('TEST',       report.splits.test);
  console.log('');
  if (report.leakage_check.passed) {
    console.log('✅ DATA LEAKAGE CHECK PASSED — No pair appears in multiple splits.');
  } else {
    console.log('❌ DATA LEAKAGE DETECTED!', report.leakage_check);
    process.exit(1);
  }
  console.log(`✅ Splits saved to: ${outputDir}`);
  console.log('═══════════════════════════════════════════════════════════');

  return report;
};

if (require.main === module) {
  const inputPath = path.join(__dirname, 'testCases_v2.json');
  const outputDir = path.join(__dirname, 'splits');
  splitDataset(inputPath, outputDir);
}

module.exports = { splitDataset };
