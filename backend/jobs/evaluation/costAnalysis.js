/**
 * Absolute Cost Analysis
 * 
 * Reviewer Requirement (Tier 2):
 * "Provide absolute cost estimates ($/1M article pairs) not just LLM call % reductions.
 *  Break down: embedding cost, DB cost, LLM cost per pipeline configuration."
 *
 * Pricing (current as of 2026):
 *  - Groq llama-3.1-8b-instant: $0.05/1M input tokens, $0.08/1M output tokens
 *  - Groq llama-3.3-70b-versatile: $0.59/1M input tokens, $0.79/1M output tokens
 *  - SBERT CPU inference: compute cost only (~$0.00/call for on-premises CPU)
 *  - MongoDB Atlas: ~$0.10/1M queries (M30 tier)
 */

const fs = require('fs');
const path = require('path');

// ── Pricing constants (USD) ───────────────────────────────────────────────────
const PRICING = {
  groq_8b_input_per_1M_tokens:   0.05,
  groq_8b_output_per_1M_tokens:  0.08,
  groq_70b_input_per_1M_tokens:  0.59,
  groq_70b_output_per_1M_tokens: 0.79,
  mongodb_per_1M_queries:         0.10,
  cpu_cost_per_hour_usd:          0.048, // m5.large on-demand AWS
  // SBERT inference: ~8ms/pair on CPU → 125 pairs/sec → 4,500,000 pairs/CPU-hour
  sbert_pairs_per_cpu_hour:       4_500_000,
};

// ── Token estimates per LLM call type (measured/estimated) ───────────────────
const TOKENS = {
  isSameEvent_input:  250,  // system prompt + two headlines (approx)
  isSameEvent_output:  50,  // JSON {isSameEvent: bool, confidence, reason}
  fuseSummary_input:  450,  // event summary + new article body
  fuseSummary_output: 200,  // fused 150-word summary
  stanceDetection_input:  350,
  stanceDetection_output:  80,
  hallucination_input:    600,
  hallucination_output:   200,
};

// ── Pipeline configurations ───────────────────────────────────────────────────
// For each 1M article ingestion events, estimate how many LLM calls are made.
// Assumptions:
//   - Average event match candidates per article: 5 (from MongoDB query)
//   - Jaccard pre-filter pass rate: 60% (→ 3 candidates go to EFSA or LLM)
//   - EFSA gate pass rate: 40% of Jaccard-passers (→ 1.2 candidates go to LLM)
//   - SBERT gate pass rate: 35% of Jaccard-passers (→ 1.05 candidates go to LLM)
//   - LLM confirms SAME event: ~25% of calls (one event per article on average)
//   - fuseEvent called once per article (~100% of articles)
//   - stanceDetection: once per confirmed event article
//   - hallucinationVerify: once per fuseEvent call

const PIPELINE_CONFIGS = [
  {
    name: 'LLM-Only (No Gate)',
    description: 'Unconditional LLM verification for all 5 candidates',
    isSameEvent_calls_per_article: 5,
    fuseSummary_calls: 1,
    stance_calls: 1,
    hallucination_calls: 1,
    sbert_pairs: 0,
    mongodb_queries: 5,
  },
  {
    name: 'Jaccard Gate + LLM',
    description: 'Lexical pre-filter reduces LLM calls to 60% of candidates',
    isSameEvent_calls_per_article: 3,
    fuseSummary_calls: 1,
    stance_calls: 1,
    hallucination_calls: 1,
    sbert_pairs: 0,
    mongodb_queries: 5,
  },
  {
    name: 'EFSA Gate + LLM (Production)',
    description: 'EFSA 5-signal gate reduces LLM calls to ~24% of all candidates',
    isSameEvent_calls_per_article: 1.2,
    fuseSummary_calls: 1,
    stance_calls: 1,
    hallucination_calls: 1,
    sbert_pairs: 0,
    mongodb_queries: 5,
  },
  {
    name: 'EFSA + DPCS Gate + LLM',
    description: 'DPCS credibility filter further reduces calls by ~15%',
    isSameEvent_calls_per_article: 1.0,
    fuseSummary_calls: 1,
    stance_calls: 1,
    hallucination_calls: 1,
    sbert_pairs: 0,
    mongodb_queries: 5,
  },
  {
    name: 'SBERT Gate + LLM',
    description: 'SBERT cosine similarity pre-filter (CPU) before LLM verification',
    isSameEvent_calls_per_article: 1.05,
    fuseSummary_calls: 1,
    stance_calls: 1,
    hallucination_calls: 1,
    sbert_pairs: 5,   // embed all 5 candidates pairwise
    mongodb_queries: 5,
  },
  {
    name: 'EFSA + SBERT + LLM (Hybrid)',
    description: 'EFSA lexical gate → SBERT semantic gate → LLM verification',
    isSameEvent_calls_per_article: 0.8,
    fuseSummary_calls: 1,
    stance_calls: 1,
    hallucination_calls: 1,
    sbert_pairs: 3,   // embed EFSA-passed candidates only
    mongodb_queries: 5,
  },
];

const computePipelineCost = (config, perMillion) => {
  const n = perMillion; // 1,000,000 articles

  // LLM costs
  const llm_isSameEvent_cost =
    (config.isSameEvent_calls_per_article * n / 1_000_000) *
    (TOKENS.isSameEvent_input * PRICING.groq_8b_input_per_1M_tokens +
     TOKENS.isSameEvent_output * PRICING.groq_8b_output_per_1M_tokens);

  const llm_fuse_cost =
    (config.fuseSummary_calls * n / 1_000_000) *
    (TOKENS.fuseSummary_input * PRICING.groq_8b_input_per_1M_tokens +
     TOKENS.fuseSummary_output * PRICING.groq_8b_output_per_1M_tokens);

  const llm_stance_cost =
    (config.stance_calls * n / 1_000_000) *
    (TOKENS.stanceDetection_input * PRICING.groq_8b_input_per_1M_tokens +
     TOKENS.stanceDetection_output * PRICING.groq_8b_output_per_1M_tokens);

  const llm_hallucination_cost =
    (config.hallucination_calls * n / 1_000_000) *
    (TOKENS.hallucination_input * PRICING.groq_70b_input_per_1M_tokens +
     TOKENS.hallucination_output * PRICING.groq_70b_output_per_1M_tokens);

  const total_llm = llm_isSameEvent_cost + llm_fuse_cost + llm_stance_cost + llm_hallucination_cost;

  // SBERT CPU cost
  const sbert_cpu_hours = (config.sbert_pairs * n) / PRICING.sbert_pairs_per_cpu_hour;
  const sbert_cost = sbert_cpu_hours * PRICING.cpu_cost_per_hour_usd;

  // MongoDB query cost
  const mongodb_cost = (config.mongodb_queries * n / 1_000_000) * PRICING.mongodb_per_1M_queries;

  const total = total_llm + sbert_cost + mongodb_cost;

  return {
    isSameEvent: Number(llm_isSameEvent_cost.toFixed(4)),
    fusion:       Number(llm_fuse_cost.toFixed(4)),
    stance:       Number(llm_stance_cost.toFixed(4)),
    hallucination: Number(llm_hallucination_cost.toFixed(4)),
    llm_total:    Number(total_llm.toFixed(4)),
    sbert_cpu:    Number(sbert_cost.toFixed(4)),
    mongodb:      Number(mongodb_cost.toFixed(4)),
    grand_total:  Number(total.toFixed(4)),
    llm_reduction_vs_llm_only: null, // computed after
    cost_per_pair: Number((total / n).toFixed(8)),
  };
};

const runCostAnalysis = () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('💰 ABSOLUTE COST ANALYSIS (USD per 1,000,000 article ingestions)');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('Pricing assumptions (Groq API, 2026):');
  console.log(`  llama-3.1-8b-instant: $${PRICING.groq_8b_input_per_1M_tokens}/1M input, $${PRICING.groq_8b_output_per_1M_tokens}/1M output tokens`);
  console.log(`  llama-3.3-70b-versatile: $${PRICING.groq_70b_input_per_1M_tokens}/1M input, $${PRICING.groq_70b_output_per_1M_tokens}/1M output tokens`);
  console.log(`  MongoDB Atlas M30: $${PRICING.mongodb_per_1M_queries}/1M queries`);
  console.log(`  CPU (AWS m5.large): $${PRICING.cpu_cost_per_hour_usd}/hour\n`);

  const results = PIPELINE_CONFIGS.map(cfg => {
    const cost = computePipelineCost(cfg, 1_000_000);
    return { config: cfg, cost };
  });

  // Compute LLM reduction vs LLM-only baseline
  const llmOnlyCost = results[0].cost.llm_total;
  results.forEach(r => {
    r.cost.llm_reduction_vs_llm_only = Number(
      ((1 - r.cost.llm_total / llmOnlyCost) * 100).toFixed(1)
    );
  });

  console.log('📊 COST BREAKDOWN TABLE (per 1M article ingestions):');
  console.log('─────────────────────────────────────────────────────────────────────────────────');
  console.log('Configuration                | isSameEvt |  Fusion  |  Stance  | Hallucin |  TOTAL $  | LLM−%');
  console.log('─────────────────────────────|────────── |──────────|──────────|──────────|───────────|──────');

  results.forEach(r => {
    const c = r.cost;
    console.log(
      `${r.config.name.padEnd(29)}| $${String(c.isSameEvent).padStart(7)} | ` +
      `$${String(c.fusion).padStart(6)} | ` +
      `$${String(c.stance).padStart(6)} | ` +
      `$${String(c.hallucination).padStart(6)} | ` +
      `$${String(c.grand_total).padStart(8)} | ` +
      `-${c.llm_reduction_vs_llm_only}%`
    );
  });

  // Pareto summary
  console.log('\n📊 PARETO SUMMARY (Cost vs Coverage/Recall):');
  console.log('─────────────────────────────────────────────────────────────────────────────────');
  results.forEach((r, i) => {
    const prevCost = i > 0 ? results[i-1].cost.grand_total : null;
    const savings  = prevCost ? (prevCost - r.cost.grand_total).toFixed(4) : '—';
    console.log(`  ${String(i+1).padEnd(2)} ${r.config.name.padEnd(28)} → $${r.cost.grand_total}/1M articles  (saves $${savings} vs prev)`);
  });

  // Break-even: when does SBERT gate pay for itself?
  const production  = results.find(r => r.config.name.includes('Production'));
  const sbertHybrid = results.find(r => r.config.name.includes('SBERT Gate'));
  if (production && sbertHybrid) {
    const sbertSavings = production.cost.grand_total - sbertHybrid.cost.grand_total;
    console.log('\n📊 SBERT GATE COST-BENEFIT:');
    console.log(`  EFSA Production cost:   $${production.cost.grand_total}/1M`);
    console.log(`  SBERT+Gate cost:        $${sbertHybrid.cost.grand_total}/1M`);
    console.log(`  Net savings: $${Math.abs(sbertSavings).toFixed(4)}/1M   (${sbertSavings >= 0 ? 'SBERT pays off' : 'SBERT adds cost'})`);
    console.log(`  At 10M articles/month: ${sbertSavings >= 0 ? '$' : '-$'}${Math.abs(sbertSavings * 10).toFixed(2)}/month`);
  }

  const output = { timestamp: new Date().toISOString(), pricing: PRICING, per_1M_articles: results.map(r => ({ name: r.config.name, description: r.config.description, ...r.cost })) };
  const outPath = path.join(__dirname, 'cost-analysis.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\n✅ Results saved to: ${outPath}`);
  console.log('═══════════════════════════════════════════════════════════');
  return output;
};

if (require.main === module) { runCostAnalysis(); }
module.exports = { runCostAnalysis };
