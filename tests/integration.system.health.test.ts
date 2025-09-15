import { describe, it, expect } from 'vitest';

// This is an integration smoke test for the handler shape, not an e2e HTTP test.
// It verifies that system handlers return the expected contract outputs.
import { buildContext } from '../app/src/orpc/server/context';
import { healthHandler, timeHandler, versionHandler } from '../app/src/orpc/server/handlers/system.handlers';

describe('integration: system.*', () => {
  it('health returns ok and version/time', async () => {
    const ctx = buildContext({ headers: {}, ip: '127.0.0.1' });
    const res = await healthHandler(ctx);
    expect(res.status).toBe('ok');
    expect(typeof res.version).toBe('string');
    expect(typeof res.time).toBe('string');
  });

  it('time returns now ISO', async () => {
    const ctx = buildContext({ headers: {}, ip: '127.0.0.1' });
    const res = await timeHandler(ctx);
    expect(typeof res.now).toBe('string');
  });

  it('version returns string', async () => {
    const ctx = buildContext({ headers: {}, ip: '127.0.0.1' });
    const res = await versionHandler(ctx);
    expect(typeof res.version).toBe('string');
  });
});

