/**
 * Unlabeled Annotation Set Creator (Zero-Dependency)
 * Samples a balanced, stratified candidate set of N=250 real pairs from candidatePairs_unlabeled.json
 * and outputs clean, blank annotation templates for double-blind human labeling.
 * 
 * Outputs:
 * - candidate_sample_250.json (Master sample of unlabeled real pairs)
 * - annotation_form_annotator_A.json (Blank form for Annotator A)
 * - annotation_form_annotator_B.json (Blank form for Annotator B)
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

function sampleBalancedPairs(allPairs, targetCount = 250) {
  console.log(`🔍 Sampling ${targetCount} balanced candidate pairs across similarity tiers...`);
  
  // Calculate similarity for sampling stratification
  const scored = allPairs.map(p => ({
    ...p,
    jaccard: computeJaccard(p.headline_a, p.headline_b)
  }));

  // Stratify into similarity tiers:
  // High similarity (J >= 0.15): candidate SAME
  // Medium similarity (0.05 <= J < 0.15): hard DIFFERENT or paraphrase SAME
  // Low similarity (J < 0.05): clear DIFFERENT
  const highSim = scored.filter(p => p.jaccard >= 0.15);
  const medSim = scored.filter(p => p.jaccard >= 0.05 && p.jaccard < 0.15);
  const lowSim = scored.filter(p => p.jaccard < 0.05);

  console.log(`  Tier breakdown available: High=${highSim.length}, Med=${medSim.length}, Low=${lowSim.length}`);

  const sampled = [];
  const takeHigh = Math.min(100, highSim.length);
  const takeMed = Math.min(100, medSim.length);
  const takeLow = Math.min(50, lowSim.length);

  sampled.push(...highSim.slice(0, takeHigh));
  sampled.push(...medSim.slice(0, takeMed));
  sampled.push(...lowSim.slice(0, takeLow));

  // Re-index IDs
  return sampled.map((p, idx) => ({
    id: `pair_${String(idx + 1).padStart(3, '0')}`,
    headline_a: p.headline_a,
    headline_b: p.headline_b,
    source_a: p.source_a,
    source_b: p.source_b,
    published_a: p.published_a,
    published_b: p.published_b,
    url_a: p.url_a,
    url_b: p.url_b,
    sector_a: p.sector_a,
    sector_b: p.sector_b,
    jaccard_score: Number(p.jaccard.toFixed(4))
  }));
}

function main() {
  const inPath = path.join(__dirname, 'candidatePairs_unlabeled.json');
  if (!fs.existsSync(inPath)) {
    console.error('❌ Error: candidatePairs_unlabeled.json not found. Run extractRealCandidatePairs.js first.');
    return;
  }

  const allPairs = JSON.parse(fs.readFileSync(inPath, 'utf8'));
  const sampledPairs = sampleBalancedPairs(allPairs, 250);

  // Save master sample
  const samplePath = path.join(__dirname, 'candidate_sample_250.json');
  fs.writeFileSync(samplePath, JSON.stringify(sampledPairs, null, 2));
  console.log(`\n✅ Saved master candidate sample (N=${sampledPairs.length}) to: ${samplePath}`);

  // Create blank labeling forms for Annotator A and Annotator B
  const blankFormA = sampledPairs.map(p => ({
    id: p.id,
    headline_a: p.headline_a,
    headline_b: p.headline_b,
    label: null, // TO BE FILLED INDEPENDENTLY BY ANNOTATOR A
    annotator_notes: ""
  }));

  const blankFormB = sampledPairs.map(p => ({
    id: p.id,
    headline_a: p.headline_a,
    headline_b: p.headline_b,
    label: null, // TO BE FILLED INDEPENDENTLY BY ANNOTATOR B
    annotator_notes: ""
  }));

  fs.writeFileSync(path.join(__dirname, 'annotation_form_annotator_A.json'), JSON.stringify(blankFormA, null, 2));
  fs.writeFileSync(path.join(__dirname, 'annotation_form_annotator_B.json'), JSON.stringify(blankFormB, null, 2));

  console.log('✅ Created blank independent annotation forms:');
  console.log('   - annotation_form_annotator_A.json');
  console.log('   - annotation_form_annotator_B.json');
}

if (require.main === module) {
  main();
}
