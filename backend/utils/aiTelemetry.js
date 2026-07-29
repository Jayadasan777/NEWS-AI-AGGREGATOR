/**
 * Production AI Telemetry Engine
 * Purpose: Tracks prompt tokens, completion tokens, total tokens, inference latency,
 * model names, success/failure metrics, and cumulative AI operational statistics.
 * Zero external dependencies. Fully backward compatible.
 */

const state = {
  totalCalls: 0,
  successCalls: 0,
  failedCalls: 0,
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  totalLatencyMs: 0,
  modelsUsed: {},
  lastCallTimestamp: null,
  recentCallLatencies: [] // Rolling window of last 50 call latencies
};

/**
 * Records a successful AI inference completion call.
 *
 * @param {Object} params
 * @param {string} params.model - Model name (e.g. 'llama-3.1-8b-instant')
 * @param {number} params.latencyMs - Inference execution latency in milliseconds
 * @param {Object} [params.usage] - Groq completion usage object
 */
const recordAiSuccess = ({ model = 'llama-3.1-8b-instant', latencyMs = 0, usage = {} }) => {
  state.totalCalls += 1;
  state.successCalls += 1;
  state.lastCallTimestamp = new Date().toISOString();

  const prompt = usage?.prompt_tokens || 0;
  const completion = usage?.completion_tokens || 0;
  const total = usage?.total_tokens || (prompt + completion);

  state.promptTokens += prompt;
  state.completionTokens += completion;
  state.totalTokens += total;
  state.totalLatencyMs += latencyMs;

  state.modelsUsed[model] = (state.modelsUsed[model] || 0) + 1;

  // Maintain rolling window of 50 latencies
  state.recentCallLatencies.push(latencyMs);
  if (state.recentCallLatencies.length > 50) {
    state.recentCallLatencies.shift();
  }
};

/**
 * Records a failed AI inference attempt.
 *
 * @param {Object} params
 * @param {string} params.model - Model name
 * @param {number} params.latencyMs - Execution latency until failure
 * @param {string} params.error - Error message string
 */
const recordAiFailure = ({ model = 'llama-3.1-8b-instant', latencyMs = 0, error = '' }) => {
  state.totalCalls += 1;
  state.failedCalls += 1;
  state.totalLatencyMs += latencyMs;
  state.lastCallTimestamp = new Date().toISOString();
  state.modelsUsed[model] = (state.modelsUsed[model] || 0) + 1;
};

/**
 * Exports cumulative telemetry summary object.
 */
const getAiTelemetrySummary = () => {
  const avgLatency = state.totalCalls > 0 ? (state.totalLatencyMs / state.totalCalls) : 0;
  
  return {
    totalCalls: state.totalCalls,
    successCalls: state.successCalls,
    failedCalls: state.failedCalls,
    successRatePercent: state.totalCalls > 0 ? Number(((state.successCalls / state.totalCalls) * 100).toFixed(2)) : 100,
    promptTokens: state.promptTokens,
    completionTokens: state.completionTokens,
    totalTokens: state.totalTokens,
    averageLatencyMs: Number(avgLatency.toFixed(2)),
    modelsUsed: { ...state.modelsUsed },
    lastCallTimestamp: state.lastCallTimestamp
  };
};

module.exports = {
  recordAiSuccess,
  recordAiFailure,
  getAiTelemetrySummary
};
