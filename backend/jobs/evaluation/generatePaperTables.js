/**
 * Paper Table Generator
 * Reads evaluation JSON outputs and formats LaTeX & Markdown tables for IEEE paper revision.
 */

const fs = require('fs');
const path = require('path');

const generatePaperTables = () => {
  const dir = __dirname;
  
  const comp = fs.existsSync(path.join(dir, 'comprehensive-results.json'))
    ? JSON.parse(fs.readFileSync(path.join(dir, 'comprehensive-results.json'), 'utf8')) : null;
  const sbert = fs.existsSync(path.join(dir, 'sbert-baseline-results.json'))
    ? JSON.parse(fs.readFileSync(path.join(dir, 'sbert-baseline-results.json'), 'utf8')) : null;
  const cost = fs.existsSync(path.join(dir, 'cost-analysis.json'))
    ? JSON.parse(fs.readFileSync(path.join(dir, 'cost-analysis.json'), 'utf8')) : null;
  const iaa = fs.existsSync(path.join(dir, 'iaa_report.json'))
    ? JSON.parse(fs.readFileSync(path.join(dir, 'iaa_report.json'), 'utf8')) : null;
  const decay = fs.existsSync(path.join(dir, 'temporal-decay-sensitivity.json'))
    ? JSON.parse(fs.readFileSync(path.join(dir, 'temporal-decay-sensitivity.json'), 'utf8')) : null;
  const dpcs = fs.existsSync(path.join(dir, 'dpcs-constant-sensitivity.json'))
    ? JSON.parse(fs.readFileSync(path.join(dir, 'dpcs-constant-sensitivity.json'), 'utf8')) : null;
  const hallucination = fs.existsSync(path.join(dir, 'hallucination-benchmark-results.json'))
    ? JSON.parse(fs.readFileSync(path.join(dir, 'hallucination-benchmark-results.json'), 'utf8')) : null;

  let markdown = `# IEEE Paper Revisions: Rendered Tables & Empirical Findings\n\n`;

  // Table VI Replacement: Main Results
  markdown += `## Table VI Replacement: Head-to-Head Performance Comparison (N=500+ Test Split)\n\n`;
  markdown += `| Pipeline Strategy | Accuracy (%) | Precision (%) | Recall (%) | F1-Score (%) | MCC |\n`;
  markdown += `| :--- | :---: | :---: | :---: | :---: | :---: |\n`;
  if (comp) {
    for (const [k, v] of Object.entries(comp.tracks)) {
      const res = v.testGate;
      markdown += `| ${v.name} | ${res.accuracy} | ${res.precision} | ${res.recall} | ${res.f1} | ${res.mcc} |\n`;
    }
  }
  if (sbert) {
    const sb = sbert.test;
    markdown += `| SBERT+HDBSCAN Baseline (MiniLM-L6-v2) | ${sb.accuracy} | ${sb.precision} | ${sb.recall} | ${sb.f1} | ${sb.mcc} |\n`;
  }

  // Table VII Replacement: Absolute Cost Analysis
  if (cost) {
    markdown += `\n## Table VII Replacement: Absolute Cost & Ingestion Pipeline Analysis ($/1M Article Pairs)\n\n`;
    markdown += `| Pipeline Configuration | isSameEvent ($) | Fusion ($) | Stance ($) | Hallucination ($) | Total Cost ($/1M) | LLM Reduction (%) |\n`;
    markdown += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n`;
    for (const r of cost.per_1M_articles) {
      markdown += `| ${r.name} | $${r.isSameEvent} | $${r.fusion} | $${r.stance} | $${r.hallucination} | **$${r.grand_total}** | -${r.llm_reduction_vs_llm_only}% |\n`;
    }
  }

  // Inter-Annotator Agreement Summary
  if (iaa) {
    markdown += `\n## Inter-Annotator Agreement (Fleiss' Kappa)\n\n`;
    markdown += `- **Overall Fleiss' κ**: ${iaa.overall.kappa} (${iaa.overall.interpretation})\n`;
    markdown += `- **Items Analysed**: ${iaa.overall.N_items} (Annotators: ${iaa.overall.n_raters})\n`;
    markdown += `- **Observed Agreement P̄**: ${iaa.overall.observed_agreement}\n`;
    markdown += `- **Reviewer Threshold Passed (κ ≥ 0.70)**: ${iaa.meets_reviewer_threshold ? 'YES ✅' : 'NO ❌'}\n`;
  }

  // Temporal Decay & DPCS Constant Summary
  if (decay && dpcs) {
    markdown += `\n## Constant & Hyperparameter Justification Summary\n\n`;
    markdown += `- **Temporal Decay λ = 0.02**: Half-life of 34.7 hours; S_temp = 0.38 at 48h window limit, suppressing events >96h below 15% contribution.\n`;
    markdown += `- **DPCS EMA α = 0.20**: Balances score stability with responsiveness.\n`;
    markdown += `- **DPCS Production Recommendation**: ${dpcs.production_recommendation.condition}\n`;
  }

  // Hallucination Reflection Benchmark Summary
  if (hallucination) {
    markdown += `\n## Hallucination Reflection Benchmark\n\n`;
    markdown += `- **Detection Rate (Sensitivity)**: ${hallucination.metrics.detectionRatePercent}%\n`;
    markdown += `- **Factual Approval Rate (Specificity)**: ${hallucination.metrics.specificityPercent}%\n`;
    markdown += `- **False Positive Rate**: ${hallucination.metrics.falsePositiveRatePercent}%\n`;
    markdown += `- **Overall Factuality Audit Accuracy**: ${hallucination.metrics.overallAccuracyPercent}%\n`;
  }

  const outPath = path.join(dir, 'paper_rendered_tables.md');
  fs.writeFileSync(outPath, markdown, 'utf8');
  console.log(`✅ Rendered paper tables saved to: ${outPath}`);
  return markdown;
};

if (require.main === module) {
  generatePaperTables();
}

module.exports = { generatePaperTables };
