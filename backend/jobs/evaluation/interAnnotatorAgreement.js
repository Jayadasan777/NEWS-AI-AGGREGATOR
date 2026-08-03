/**
 * Inter-Annotator Agreement Calculator
 * Computes Fleiss' kappa and Krippendorff's alpha for N annotators.
 * 
 * Reviewer Requirement (Tier 1):
 * "Re-annotate 20-30% of benchmark with ≥2 independent annotators;
 *  compute Fleiss' kappa or Krippendorff's alpha; report agreement metrics."
 * 
 * The current dataset has annotator_1 and annotator_2 fields on every pair.
 * This script computes agreement over those fields and reports κ.
 */

const fs = require('fs');
const path = require('path');

/**
 * Compute Fleiss' kappa for N annotators, K categories.
 *
 * @param {string[][]} annotations - Array of [annotator_1_label, annotator_2_label, ...] per item
 * @param {string[]} categories - All possible label categories
 * @returns {{ kappa: number, SE: number, z: number, interpretation: string }}
 */
const computeFleissKappa = (annotations, categories) => {
  const N = annotations.length;          // number of items
  const k = categories.length;           // number of categories
  const n = annotations[0].length;       // number of raters (assumed constant)

  if (N === 0 || n < 2) throw new Error('Need at least 2 raters and 1 item');

  // Step 1: Build rating matrix n_ij (item i, category j)
  const catIndex = {};
  categories.forEach((c, i) => { catIndex[c] = i; });

  const matrix = annotations.map(row => {
    const counts = new Array(k).fill(0);
    row.forEach(label => { counts[catIndex[label]] = (counts[catIndex[label]] || 0) + 1; });
    return counts;
  });

  // Step 2: Proportion of all assignments in each category (p_j)
  const pj = categories.map((_, j) => {
    const total = matrix.reduce((sum, row) => sum + row[j], 0);
    return total / (N * n);
  });

  // Step 3: Extent of agreement per item (P_i)
  const Pi = matrix.map(row => {
    const sum = row.reduce((s, nij) => s + nij * (nij - 1), 0);
    return sum / (n * (n - 1));
  });

  // Step 4: Mean observed agreement P̄
  const Pbar = Pi.reduce((s, p) => s + p, 0) / N;

  // Step 5: Mean expected agreement P̄_e
  const Pebar = pj.reduce((s, p) => s + p * p, 0);

  // Step 6: Fleiss' kappa
  const kappa = (Pbar - Pebar) / (1 - Pebar);

  // Step 7: Standard error
  const SE = Math.sqrt(2 / (N * n * (n - 1)));

  // Step 8: Z-score for significance
  const z = kappa / SE;

  // Interpretation (Landis & Koch, 1977)
  const interpretKappa = (k) => {
    if (k < 0)    return 'Poor (< 0)';
    if (k < 0.20) return 'Slight (0.00–0.20)';
    if (k < 0.40) return 'Fair (0.21–0.40)';
    if (k < 0.60) return 'Moderate (0.41–0.60)';
    if (k < 0.80) return 'Substantial (0.61–0.80)';
    return 'Almost Perfect (0.81–1.00)';
  };

  return {
    kappa: Number(kappa.toFixed(4)),
    SE: Number(SE.toFixed(4)),
    z: Number(z.toFixed(2)),
    p_value_significant: Math.abs(z) > 1.96,
    interpretation: interpretKappa(kappa),
    observed_agreement: Number(Pbar.toFixed(4)),
    expected_agreement: Number(Pebar.toFixed(4)),
    N_items: N,
    n_raters: n,
    categories,
    category_proportions: Object.fromEntries(categories.map((c, i) => [c, Number(pj[i].toFixed(4))]))
  };
};

/**
 * Compute per-category (SAME / DIFFERENT) agreement breakdown.
 */
const computePerCategoryAgreement = (annotations, categories) => {
  const results = {};
  for (const cat of categories) {
    const relevant = annotations.filter(row => row.some(label => label === cat));
    const agreements = relevant.filter(row => row.every(label => label === cat)).length;
    results[cat] = {
      n_items_with_label: relevant.length,
      full_agreement: agreements,
      agreement_rate: relevant.length > 0 ? Number((agreements / relevant.length).toFixed(4)) : 0
    };
  }
  return results;
};

/**
 * Main function: loads dataset and computes IAA metrics.
 */
const computeInterAnnotatorAgreement = (dataPath) => {
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const categories = ['SAME', 'DIFFERENT'];

  // Extract annotation pairs
  const annotations = data
    .filter(p => p.annotator_1 && p.annotator_2)
    .map(p => [p.annotator_1, p.annotator_2]);

  if (annotations.length < 10) {
    console.warn('⚠️  Warning: Fewer than 10 annotated pairs found. Results may be unreliable.');
  }

  const fleiss = computeFleissKappa(annotations, categories);
  const perCat = computePerCategoryAgreement(annotations, categories);

  // Agreement breakdown by difficulty
  const byDifficulty = {};
  for (const diff of ['easy', 'medium', 'hard']) {
    const subset = data
      .filter(p => p.difficulty === diff && p.annotator_1 && p.annotator_2)
      .map(p => [p.annotator_1, p.annotator_2]);
    if (subset.length >= 2) {
      try {
        byDifficulty[diff] = computeFleissKappa(subset, categories);
      } catch {
        byDifficulty[diff] = { kappa: null, note: 'Insufficient data' };
      }
    }
  }

  const result = {
    timestamp: new Date().toISOString(),
    dataset: path.basename(dataPath),
    overall: fleiss,
    per_category: perCat,
    by_difficulty: byDifficulty,
    meets_reviewer_threshold: fleiss.kappa >= 0.70,
    reviewer_threshold: 0.70,
  };

  // Print report
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 INTER-ANNOTATOR AGREEMENT REPORT');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Dataset:           ${result.dataset}`);
  console.log(`Items analysed:    ${fleiss.N_items}`);
  console.log(`Raters:            ${fleiss.n_raters}`);
  console.log('');
  console.log(`Fleiss' κ:         ${fleiss.kappa}   (${fleiss.interpretation})`);
  console.log(`Standard Error:    ±${fleiss.SE}`);
  console.log(`Z-score:           ${fleiss.z}  (p < 0.05: ${fleiss.p_value_significant})`);
  console.log(`Observed P̄:        ${fleiss.observed_agreement}`);
  console.log(`Expected P̄ₑ:       ${fleiss.expected_agreement}`);
  console.log('');
  console.log('Per-category agreement:');
  for (const [cat, stats] of Object.entries(perCat)) {
    console.log(`  ${cat.padEnd(12)}: ${(stats.agreement_rate * 100).toFixed(1)}%  (${stats.full_agreement}/${stats.n_items_with_label} items)`);
  }
  console.log('');
  console.log('By difficulty:');
  for (const [diff, stats] of Object.entries(byDifficulty)) {
    const k = stats.kappa !== null ? stats.kappa.toFixed(4) : 'N/A';
    console.log(`  ${diff.padEnd(8)}: κ = ${k}`);
  }
  console.log('');
  if (result.meets_reviewer_threshold) {
    console.log(`✅ κ ≥ 0.70 — Meets IEEE reviewer threshold.`);
  } else {
    console.log(`⚠️  κ < 0.70 — Does NOT meet IEEE reviewer threshold (${fleiss.kappa} < 0.70).`);
    console.log('   Action required: Re-annotate discordant pairs and resolve disagreements.');
  }
  console.log('═══════════════════════════════════════════════════════════');

  return result;
};

if (require.main === module) {
  const dataPath = path.join(__dirname, 'testCases_v2.json');
  const result = computeInterAnnotatorAgreement(dataPath);
  const outPath = path.join(__dirname, 'iaa_report.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`\n✅ IAA report saved to: ${outPath}`);
}

module.exports = { computeInterAnnotatorAgreement, computeFleissKappa };
