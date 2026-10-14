/**
 * Run NISE cascade on 198-pair test set and log stage counts
 * This will give us ONE CONSISTENT result set for the paper
 */

const fs = require('fs');
const path = require('path');

// Load test data
const testPairs = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'statistical_significance_results.json'), 'utf8')
);

// Extract the 198-pair test set configuration
const testSetConfig = testPairs.results.find(r =>
  r.configuration === 'Production 2-Stage Baseline (NISE)'
);

console.log('=== NISE CASCADE EVALUATION ON 198-PAIR TEST SET ===\n');

if (!testSetConfig) {
  console.error('ERROR: No NISE cascade results found in statistical_significance_results.json');
  console.error('Need to run actual cascade evaluation');
  process.exit(1);
}

console.log('Test Set Size:', testSetConfig.total_n);
console.log('Confusion Matrix:');
console.log('  TP:', testSetConfig.tp);
console.log('  FP:', testSetConfig.fp);
console.log('  TN:', testSetConfig.tn);
console.log('  FN:', testSetConfig.fn);
console.log('\nMetrics:');
console.log('  Accuracy:', testSetConfig.accuracy_formatted);
console.log('  Precision:', testSetConfig.precision_formatted);
console.log('  Recall:', testSetConfig.recall_formatted);
console.log('  F1:', testSetConfig.f1_formatted);

// Calculate what we DON'T have
console.log('\n=== MISSING DATA NEEDED FOR PAPER ===\n');
console.log('[TBD] Stage 1 pass count: How many pairs pass lexical gates?');
console.log('[TBD] Stage 2 pass count: How many pairs exceed EFSA threshold ≥0.22?');
console.log('[TBD] Stage 3 count: How many pairs actually sent to LLM?');
console.log('[TBD] LLM call reduction: (198 - LLM_count) / 198 × 100%');

console.log('\n=== ACTION REQUIRED ===\n');
console.log('1. Run cascade on all 198 test pairs with logging');
console.log('2. Log pass count at each stage:');
console.log('   - After Stage 1 (lexical gates)');
console.log('   - After Stage 2 (EFSA scoring)');
console.log('   - After Stage 3 (LLM verification)');
console.log('3. Save results to: cascade_198_test_results.json');

// Create template output file
const outputTemplate = {
  test_set_size: 198,
  positive_pairs: 99,
  negative_pairs: 99,
  stage_1_lexical_gates: {
    passed: '[TBD]',
    rejected: '[TBD]',
    pass_rate: '[TBD]'
  },
  stage_2_efsa_scoring: {
    threshold: 0.22,
    exceeded_threshold: '[TBD]',
    below_threshold: '[TBD]',
    pass_rate: '[TBD]'
  },
  stage_3_llm_verification: {
    llm_calls_made: '[TBD]',
    llm_calls_saved: '[TBD]',
    reduction_percentage: '[TBD]'
  },
  final_results: {
    tp: testSetConfig.tp,
    fp: testSetConfig.fp,
    tn: testSetConfig.tn,
    fn: testSetConfig.fn,
    accuracy: testSetConfig.accuracy,
    precision: testSetConfig.precision,
    recall: testSetConfig.recall,
    f1: testSetConfig.f1_score,
    mcc: '[TBD]'
  },
  notes: 'Fill in [TBD] values by actually running the cascade with stage logging'
};

fs.writeFileSync(
  path.join(__dirname, 'cascade_198_test_TEMPLATE.json'),
  JSON.stringify(outputTemplate, null, 2)
);

console.log('\n✅ Created template: cascade_198_test_TEMPLATE.json');
console.log('   Fill this with actual run data\n');
