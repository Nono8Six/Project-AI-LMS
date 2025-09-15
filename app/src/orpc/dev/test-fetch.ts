import { RPCHandler } from '@orpc/server/fetch';
import { appRouter, fetchPlugins } from '../../orpc/server/router';
import { buildContext } from '../../orpc/server/context';
import { API_CONSTANTS } from '../../shared/constants/api';

async function call(path: string, init?: RequestInit) {
  const handler = new RPCHandler(appRouter, { plugins: fetchPlugins });
  const req = new Request(`http://test${API_CONSTANTS.prefix}${path}`, init);
  const context = buildContext({ headers: req.headers, ip: '127.0.0.1' });
  const res = await handler.handle(req, { prefix: API_CONSTANTS.prefix, context });
  if (!res.matched || !res.response) {
    console.warn('NOT_MATCHED');
    return;
  }
  const text = await res.response.text();
  const h = res.response.headers;
  console.warn(
    res.response.status,
    'retry-after=', h.get('retry-after') || '',
    'x-rl:', h.get('x-ratelimit-limit'), h.get('x-ratelimit-remaining'), h.get('x-ratelimit-reset'),
    text,
  );
}

async function main() {
  // Health OK
  await call('/system/health', { method: 'POST' });

  // Rate limit: hit more than budget for anonymous
  const tries = 5;
  for (let i = 0; i < tries; i++) {
    await call('/system/health', { method: 'POST' });
  }

  // Body limit: send content-length above max
  const big = 'A'.repeat(100_000);
  await call('/system/health', {
    method: 'POST',
    body: big,
    headers: { 'content-type': 'application/json', 'content-length': String(big.length) },
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
