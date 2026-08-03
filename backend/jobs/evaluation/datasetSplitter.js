/**
 * Dataset Splitter Script for Real Benchmark (testCases_v2_real.json)
 * Performs a 60/20/20 train/validation/test split stratified by sector and SAME/DIFFERENT labels.
 * Outputs:
 * - splits_real/train.json
 * - splits_real/val.json
 * - splits_real/test.json
 * - splits_real/split_report_real.json
 */

const fs = require('fs');
const path = require('path');

function shuffleArray(arr, seed = 42) {
  const array = [...arr];
  let m = array.length, t, i;
  let s = seed;
  const pseudoRandom = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  while (m) {
    i = Math.floor(pseudoRandom() * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }
  return array;
}

function runStratifiedSplit() {
  const dataPath = path.join(__dirname, 'testCases_v2_real.json');
  if (!fs.existsSync(dataPath)) {
    console.error('❌ Error: testCases_v2_real.json not found.');
    return;
  }

  const dataset = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`✂️ Partitioning real dataset N=${dataset.length} into 60/20/20 train/val/test splits...`);

  // Group by (sector + expected label) for stratification
  const strata = {};
  dataset.forEach(item => {
    const key = `${item.sector || 'General'}_${item.expected}`;
    if (!strata[key]) strata[key] = [];
    strata[key].push(item);
  });

  const train = [];
  const val = [];
  const test = [];

  for (const [key, items] of Object.entries(strata)) {
    const shuffled = shuffleArray(items);
    const n = shuffled.length;
    const nTrain = Math.floor(n * 0.60);
    const nVal = Math.floor(n * 0.20);

    train.push(...shuffled.slice(0, nTrain));
    val.push(...shuffled.slice(nTrain, nTrain + nVal));
    test.push(...shuffled.slice(nTrain + nVal));
  }

  const outDir = path.join(__dirname, 'splits_real');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(path.join(outDir, 'train.json'), JSON.stringify(train, null, 2));
  fs.writeFileSync(path.join(outDir, 'val.json'), JSON.stringify(val, null, 2));
  fs.writeFileSync(path.join(outDir, 'test.json'), JSON.stringify(test, null, 2));

  const report = {
    timestamp: new Date().toISOString(),
    total_items: dataset.length,
    train_count: train.length,
    val_count: val.length,
    test_count: test.length,
    train_ratio: Number((train.length / dataset.length).toFixed(4)),
    val_ratio: Number((val.length / dataset.length).toFixed(4)),
    test_ratio: Number((test.length / dataset.length).toFixed(4)),
    strata_count: Object.keys(strata).length
  };

  fs.writeFileSync(path.join(outDir, 'split_report_real.json'), JSON.stringify(report, null, 2));

  console.log(`✅ Stratified split complete:`);
  console.log(`   - Train split (60%): ${train.length} pairs`);
  console.log(`   - Val split   (20%): ${val.length} pairs (Tuned hyperparameters ONLY here)`);
  console.log(`   - Test split  (20%): ${test.length} pairs (Reported metrics ONLY here)`);
}

if (require.main === module) {
  runStratifiedSplit();
}
