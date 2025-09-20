#!/usr/bin/env node

/**
 * Script de test des routes oRPC
 * Vérifie que toutes les routes renvoient les codes de status attendus
 * et que les headers requis sont présents
 */

const API_BASE = 'http://localhost:3000/api/rpc';

const routes = [
  {
    name: 'Health Check',
    url: `${API_BASE}/system/health`,
    expectedStatus: 200,
    requiredHeaders: ['x-request-id'],
    expectedFields: ['status', 'time', 'version']
  },
  {
    name: 'System Time',
    url: `${API_BASE}/system/time`,
    expectedStatus: 200,
    requiredHeaders: ['x-request-id'],
    expectedFields: ['now']
  },
  {
    name: 'System Version',
    url: `${API_BASE}/system/version`,
    expectedStatus: 200,
    requiredHeaders: ['x-request-id'],
    expectedFields: ['version']
  },
  {
    name: 'Auth Me (no token)',
    url: `${API_BASE}/auth/me`,
    expectedStatus: 200,
    requiredHeaders: ['x-request-id'],
    expectedFields: null // Peut être null
  },
  {
    name: 'Auth Secure (no token)',
    url: `${API_BASE}/auth/secure`,
    expectedStatus: 401,
    requiredHeaders: ['x-request-id'],
    expectedFields: ['message'] // oRPC error format
  }
];

async function testRoute(route) {
  try {
    console.log(`🧪 Testing: ${route.name}`);

    const response = await fetch(route.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    // Vérifier le status code
    const statusOk = response.status === route.expectedStatus;
    console.log(`   Status: ${response.status} ${statusOk ? '✅' : '❌'} (expected ${route.expectedStatus})`);

    // Vérifier les headers requis
    let headersOk = true;
    for (const header of route.requiredHeaders) {
      const value = response.headers.get(header);
      const present = !!value;
      console.log(`   Header ${header}: ${present ? '✅' : '❌'} ${present ? `(${value})` : '(missing)'}`);
      if (!present) headersOk = false;
    }

    // Vérifier le body
    let bodyOk = true;
    try {
      const rawData = await response.json();
      console.log(`   Body: Valid JSON ✅`);

      // oRPC peut wrapper les réponses dans { json: ... } ou directement retourner les données
      const data = rawData.json !== undefined ? rawData.json : rawData;

      if (route.expectedFields) {
        for (const field of route.expectedFields) {
          const present = data && typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, field);
          console.log(`   Field ${field}: ${present ? '✅' : '❌'}`);
          if (!present) bodyOk = false;
        }
      } else {
        console.log(`   Body content: ${JSON.stringify(data)} ✅`);
      }
    } catch (error) {
      console.log(`   Body: Invalid JSON ❌ (${error.message})`);
      bodyOk = false;
    }

    const success = statusOk && headersOk && bodyOk;
    console.log(`   Result: ${success ? '🎉 PASS' : '💥 FAIL'}\n`);

    return success;

  } catch (error) {
    console.log(`   Error: ❌ ${error.message}\n`);
    return false;
  }
}

async function testRateLimit() {
  console.log(`🧪 Testing: Rate Limiting`);

  try {
    // Utiliser un endpoint auth qui a le rate limiting activé
    const response1 = await fetch(`${API_BASE}/auth/me`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '203.0.113.1' // IP de test
      },
      body: JSON.stringify({})
    });

    console.log(`   First call: ${response1.status} ${response1.status === 200 ? '✅' : '❌'}`);

    // Vérifier headers rate limit
    const limit = response1.headers.get('x-ratelimit-limit');
    const remaining = response1.headers.get('x-ratelimit-remaining');
    const reset = response1.headers.get('x-ratelimit-reset');

    console.log(`   Rate limit headers:`);
    console.log(`     x-ratelimit-limit: ${limit ? '✅' : '❌'} (${limit})`);
    console.log(`     x-ratelimit-remaining: ${remaining ? '✅' : '❌'} (${remaining})`);
    console.log(`     x-ratelimit-reset: ${reset ? '✅' : '❌'} (${reset})`);

    const headersOk = limit && remaining && reset;
    console.log(`   Rate limit headers: ${headersOk ? '✅' : '❌'}`);

    // Note: Les endpoints système n'ont pas de rate limiting par design (performance)
    if (!headersOk) {
      console.log(`   ℹ️  Note: System endpoints skip rate limiting for performance`);
      console.log(`   ℹ️  Testing with auth endpoint instead for rate limit headers`);
    }

    console.log(`   Result: ${response1.status === 200 && headersOk ? '🎉 PASS' : '💥 FAIL'}\n`);

    return response1.status === 200 && headersOk;

  } catch (error) {
    console.log(`   Error: ❌ ${error.message}\n`);
    return false;
  }
}

async function main() {
  console.log('🚀 oRPC Routes Test Suite\n');
  console.log('🔗 Testing against:', API_BASE);
  console.log('ℹ️  Make sure the dev server is running (pnpm dev)\n');

  const results = [];

  // Tester toutes les routes
  for (const route of routes) {
    const success = await testRoute(route);
    results.push({ name: route.name, success });
  }

  // Tester rate limiting
  const rateLimitSuccess = await testRateLimit();
  results.push({ name: 'Rate Limiting', success: rateLimitSuccess });

  // Résumé
  console.log('📊 Test Results Summary:');
  console.log('========================');

  let totalPassed = 0;
  for (const result of results) {
    console.log(`${result.success ? '✅' : '❌'} ${result.name}`);
    if (result.success) totalPassed++;
  }

  console.log(`\n🎯 Score: ${totalPassed}/${results.length} tests passed`);

  if (totalPassed === results.length) {
    console.log('🎉 All tests passed! oRPC API is working correctly.');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed. Check the output above for details.');
    process.exit(1);
  }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Lancer les tests
main().catch(console.error);