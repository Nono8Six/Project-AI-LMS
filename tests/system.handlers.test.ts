import { describe, it, expect } from 'vitest';
import { healthHandler, timeHandler, versionHandler } from '../app/src/orpc/server/handlers/system.handlers';
import { buildContext } from '../app/src/orpc/server/context';

function ctx() {
  return buildContext({ headers: {}, ip: '127.0.0.1' });
}

describe('system handlers', () => {
  it('health returns ok with version and time', async () => {
    const res = await healthHandler(ctx());
    expect(res.status).toBe('ok');
    expect(typeof res.version).toBe('string');
    expect(typeof res.time).toBe('string');
  });

  it('time returns ISO now', async () => {
    const res = await timeHandler(ctx());
    expect(typeof res.now).toBe('string');
  });

  it('version returns version string', async () => {
    const res = await versionHandler(ctx());
    expect(typeof res.version).toBe('string');
  });
});

