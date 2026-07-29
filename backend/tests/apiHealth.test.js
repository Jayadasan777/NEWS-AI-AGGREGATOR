/**
 * Zero-Dependency Automated Integration & Health Test Suite
 * Purpose: Validates API endpoints (/ping, /api/health, /api/articles, /api/events, /api/social/queue)
 * using Node.js native assert and http/https modules.
 * Fully backward compatible. No external testing dependencies required.
 */

const assert = require('assert');
const http = require('http');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

/**
 * Helper to execute HTTP GET request and parse JSON response
 */
const fetchJson = (urlPath) => {
  return new Promise((resolve, reject) => {
    const fullUrl = `${BASE_URL}${urlPath}`;
    http.get(fullUrl, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const isJson = (res.headers['content-type'] || '').includes('application/json');
          const parsed = isJson ? JSON.parse(rawData) : rawData;
          resolve({ statusCode: res.statusCode, headers: res.headers, data: parsed });
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', (err) => reject(err));
  });
};

const runTests = async () => {
  console.log('====================================================');
  console.log('🧪 RUNNING AUTOMATED API INTEGRATION TEST SUITE');
  console.log('====================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  const test = async (name, testFn) => {
    try {
      await testFn();
      console.log(`✅ PASS: ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`❌ FAIL: ${name} -> ${err.message}`);
      failedCount++;
    }
  };

  // Test 1: GET /ping
  await test('GET /ping returns HTTP 200 OK', async () => {
    const res = await fetchJson('/ping');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data, 'OK');
  });

  // Test 2: GET /api/health
  await test('GET /api/health returns valid JSON with status UP', async () => {
    const res = await fetchJson('/api/health');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.status, 'UP');
    assert.strictEqual(typeof res.data.uptimeSeconds, 'number');
  });

  // Test 3: GET /api/articles
  await test('GET /api/articles returns valid JSON response', async () => {
    const res = await fetchJson('/api/articles');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(typeof res.data.success, 'boolean');
    assert.ok(Array.isArray(res.data.data));
  });

  // Test 4: GET /api/events
  await test('GET /api/events returns valid JSON response', async () => {
    const res = await fetchJson('/api/events');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(typeof res.data.success, 'boolean');
    assert.ok(Array.isArray(res.data.data));
  });

  // Test 5: GET /api/social/queue
  await test('GET /api/social/queue returns valid JSON response', async () => {
    const res = await fetchJson('/api/social/queue');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(typeof res.data.success, 'boolean');
    assert.ok(Array.isArray(res.data.data));
  });

  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passedCount} Passed, ${failedCount} Failed`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    throw new Error(`${failedCount} test(s) failed.`);
  }
};

// If run directly via CLI
if (require.main === module) {
  runTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Test Suite Failed:', err.message);
      process.exit(1);
    });
}

module.exports = runTests;
