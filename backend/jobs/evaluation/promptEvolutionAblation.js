/**
 * Prompt Evolution Ablation Study
 *
 * Reviewer Requirement (Tier 1):
 * "Include verbatim LLM prompts and evolution history as an appendix;
 *  demonstrate prompt iteration impact on precision/recall."
 *
 * Compares 3 prompt variants on the validation split:
 * 1. Minimal Prompt (v1 Gemini era baseline, no examples)
 * 2. Production Few-Shot Prompt (v3, current production)
 * 3. Chain-of-Thought Prompt (v4 experimental, explicit reasoning step)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const fs = require('fs');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const PROMPT_VARIANTS = {
  v1_minimal: (titleA, titleB) => `Are these two news headlines about the same real-world event? Answer with ONLY "SAME" or "DIFFERENT".

Headline A: "${titleA}"
Headline B: "${titleB}"`,

  v3_fewshot_production: (titleA, titleB) => `You are a news analyst identifying duplicate event coverage across different news outlets.

Two different outlets often describe the SAME real-world event using completely different wording — different named people, different phrasing, different emphasis. Judge whether the underlying event is the same, NOT whether the wording matches.

However, be careful: two headlines about the SAME company, person, or topic are NOT automatically the same event. Only answer SAME if they describe the identical specific incident, decision, or occurrence. A company can have multiple genuinely different things happen to it on the same day.

Examples of SAME event (different wording, same occurrence):
- "US Federal Reserve cuts interest rates by 50 basis points" and "Jerome Powell announces major rate slash at FOMC meeting" → SAME
- "OpenAI releases GPT-5" and "Sam Altman unveils OpenAI's newest flagship model" → SAME

Examples of DIFFERENT events (same entity/topic, but genuinely separate occurrences):
- "Alphabet fined by EU for favouring its own apps" and "Alphabet reports record quarterly earnings" → DIFFERENT (same company, but a regulatory fine and an earnings report are unrelated events)
- "European Central Bank leaves interest rate unchanged" and "Fed funds futures price in chance of rate hike" → DIFFERENT (same general topic, but two different institutions making separate decisions)
- "Apple unveils new AI chip" and "Apple stock rises after chip announcement" → DIFFERENT (the announcement and the market's reaction to it are two distinct events)

Now judge this pair:
Headline A: "${titleA}"
Headline B: "${titleB}"

Do they describe the SAME specific real-world event, or DIFFERENT events? Respond with ONLY one word: "SAME" or "DIFFERENT". Do not write anything else.`,

  v4_chain_of_thought: (titleA, titleB) => `Analyze whether these two headlines report the exact same event.

Headline A: "${titleA}"
Headline B: "${titleB}"

Step 1: Identify the main entity and specific action/incident in Headline A.
Step 2: Identify the main entity and specific action/incident in Headline B.
Step 3: Determine if they refer to the exact same incident or distinct occurrences.

Finish with your final decision formatted exactly as:
DECISION: SAME or DECISION: DIFFERENT`
};

const queryGroq = async (prompt, model = 'llama-3.1-8b-instant') => {
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model,
      temperature: 0.1,
    });
    return completion.choices[0]?.message?.content?.trim() || '';
  } catch (err) {
    console.error('Groq query error:', err.message);
    return '';
  }
};

const parseResponse = (raw, variantKey) => {
  const text = raw.toUpperCase();
  if (variantKey === 'v4_chain_of_thought') {
    if (text.includes('DECISION: SAME')) return 'SAME';
    if (text.includes('DECISION: DIFFERENT')) return 'DIFFERENT';
  }
  if (text.includes('SAME')) return 'SAME';
  if (text.includes('DIFFERENT')) return 'DIFFERENT';
  return 'DIFFERENT';
};

const runPromptEvolutionAblation = async () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 PROMPT EVOLUTION ABLATION STUDY');
  console.log('═══════════════════════════════════════════════════════════\n');

  const splitsDir = path.join(__dirname, 'splits');
  // Evaluate on a subset of validation set to respect rate limits while gaining empirical baseline
  const valData = JSON.parse(fs.readFileSync(path.join(splitsDir, 'validation.json'), 'utf8')).slice(0, 30);

  console.log(`Evaluating ${valData.length} validation pair samples across 3 prompt strategies...\n`);

  const results = {};

  for (const [vKey, promptFn] of Object.entries(PROMPT_VARIANTS)) {
    console.log(`⏳ Running prompt variant: ${vKey}...`);
    let tp = 0, fp = 0, tn = 0, fn = 0;

    for (const pair of valData) {
      const prompt = promptFn(pair.headline_a, pair.headline_b);
      const rawResp = await queryGroq(prompt);
      const predicted = parseResponse(rawResp, vKey);

      if (pair.expected === 'SAME' && predicted === 'SAME') tp++;
      else if (pair.expected === 'DIFFERENT' && predicted === 'DIFFERENT') tn++;
      else if (pair.expected === 'DIFFERENT' && predicted === 'SAME') fp++;
      else if (pair.expected === 'SAME' && predicted === 'DIFFERENT') fn++;
    }

    const total = tp + fp + tn + fn;
    const acc = total > 0 ? (tp + tn) / total : 0;
    const prec = tp + fp > 0 ? tp / (tp + fp) : 0;
    const rec = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = prec + rec > 0 ? (2 * prec * rec) / (prec + rec) : 0;

    results[vKey] = {
      accuracy: Number((acc * 100).toFixed(2)),
      precision: Number((prec * 100).toFixed(2)),
      recall: Number((rec * 100).toFixed(2)),
      f1: Number((f1 * 100).toFixed(2)),
      confusion: { tp, fp, tn, fn }
    };

    console.log(`   ${vKey}: Acc=${results[vKey].accuracy}% | Prec=${results[vKey].precision}% | Rec=${results[vKey].recall}% | F1=${results[vKey].f1}%\n`);
  }

  const outPath = path.join(__dirname, 'prompt-evolution-results.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`✅ Results saved to: ${outPath}`);
  console.log('═══════════════════════════════════════════════════════════');
  return results;
};

if (require.main === module) {
  runPromptEvolutionAblation()
    .then(() => process.exit(0))
    .catch(err => { console.error('Prompt evolution test failed:', err); process.exit(1); });
}

module.exports = { runPromptEvolutionAblation };
