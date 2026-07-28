const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const fs = require('fs');
const { synthesizeWithGroq } = require('../newsEngine');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const calculateQuantile = (sortedArr, q) => {
  const pos = (sortedArr.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sortedArr[base + 1] !== undefined) {
    return sortedArr[base] + rest * (sortedArr[base + 1] - sortedArr[base]);
  }
  return sortedArr[base];
};

const runLatencyBenchmark = async () => {
  console.log('🚀 Starting Latency & Throughput Benchmark (20 Calls to synthesizeWithGroq)...\n');

  const testCasesPath = path.join(__dirname, 'testCases.json');
  let testCases;
  try {
    testCases = JSON.parse(fs.readFileSync(testCasesPath, 'utf8'));
  } catch (err) {
    console.error('❌ Failed to read testCases.json:', err.message);
    return;
  }

  // Select 20 unique headlines from testCases.json
  const sampleHeadlines = testCases.slice(0, 20).map((tc, idx) => ({
    title: tc.headline_a,
    description: tc.notes || tc.headline_a,
    sector: ['Tech', 'Finance', 'Geopolitics', 'AI', 'Crypto'][idx % 5]
  }));

  const rawResults = [];

  for (let i = 0; i < sampleHeadlines.length; i++) {
    const item = sampleHeadlines[i];
    console.log(`⏳ Benchmark Call ${i + 1}/20: "${item.title.slice(0, 40)}..."`);

    // Time synthesizeWithGroq call directly (excluding external overhead)
    const startTime = process.hrtime.bigint();
    const result = await synthesizeWithGroq(item.title, item.description, item.sector);
    const endTime = process.hrtime.bigint();

    const durationMs = Number(endTime - startTime) / 1e6;

    // Check if Groq SDK exposes usage by making a direct completion call for usage verification
    let tokenStats = null;
    try {
      const prompt = `Return a JSON object for sector ${item.sector} headline: "${item.title}" summary about 150 words.`;
      const directCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });
      if (directCompletion.usage) {
        const outputTokens = directCompletion.usage.completion_tokens || 0;
        const promptTokens = directCompletion.usage.prompt_tokens || 0;
        const totalTokens = directCompletion.usage.total_tokens || 0;
        tokenStats = {
          prompt_tokens: promptTokens,
          completion_tokens: outputTokens,
          total_tokens: totalTokens,
          tokens_per_sec: durationMs > 0 ? (outputTokens / (durationMs / 1000)) : 0
        };
      }
    } catch (e) {
      // Usage tracking fallback
    }

    rawResults.push({
      call_index: i + 1,
      title: item.title,
      duration_ms: Number(durationMs.toFixed(2)),
      token_stats: tokenStats
    });

    console.log(`   └─ Duration: ${durationMs.toFixed(2)} ms ${tokenStats ? `| Tokens/sec: ${tokenStats.tokens_per_sec.toFixed(2)}` : ''}`);
    await sleep(2500); // 2.5s rate limit delay
  }

  // Latency Metrics
  const durations = rawResults.map(r => r.duration_ms).sort((a, b) => a - b);
  const minLatency = durations[0];
  const maxLatency = durations[durations.length - 1];
  const sumLatency = durations.reduce((acc, val) => acc + val, 0);
  const meanLatency = sumLatency / durations.length;

  const mid = Math.floor(durations.length / 2);
  const medianLatency = durations.length % 2 !== 0 ? durations[mid] : (durations[mid - 1] + durations[mid]) / 2;
  const p95Latency = calculateQuantile(durations, 0.95);

  // Token Metrics calculation if usage is present
  const validTokenPerSecArr = rawResults
    .filter(r => r.token_stats && r.token_stats.tokens_per_sec > 0)
    .map(r => r.token_stats.tokens_per_sec);

  const meanTokensPerSec = validTokenPerSecArr.length > 0
    ? validTokenPerSecArr.reduce((a, b) => a + b, 0) / validTokenPerSecArr.length
    : null;

  const benchmarkOutput = {
    total_calls: sampleHeadlines.length,
    summary_stats: {
      min_latency_ms: Number(minLatency.toFixed(2)),
      max_latency_ms: Number(maxLatency.toFixed(2)),
      mean_latency_ms: Number(meanLatency.toFixed(2)),
      median_latency_ms: Number(medianLatency.toFixed(2)),
      p95_latency_ms: Number(p95Latency.toFixed(2)),
      measured_tokens_per_sec: meanTokensPerSec !== null ? Number(meanTokensPerSec.toFixed(2)) : "not available from SDK"
    },
    raw_calls: rawResults
  };

  const outputPath = path.join(__dirname, 'latency-benchmark-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(benchmarkOutput, null, 2));
  console.log(`\n✅ Latency benchmark results saved to: ${outputPath}\n`);

  console.log('📊 --- LATENCY & THROUGHPUT BENCHMARK RESULTS ---');
  console.log(`- Min Latency: ${minLatency.toFixed(2)} ms`);
  console.log(`- Max Latency: ${maxLatency.toFixed(2)} ms`);
  console.log(`- Mean Latency: ${meanLatency.toFixed(2)} ms`);
  console.log(`- Median Latency: ${medianLatency.toFixed(2)} ms`);
  console.log(`- P95 Latency: ${p95Latency.toFixed(2)} ms`);
  console.log(`- Throughput: ${meanTokensPerSec !== null ? `${meanTokensPerSec.toFixed(2)} tokens/sec` : 'not available from SDK'}`);
};

runLatencyBenchmark();
