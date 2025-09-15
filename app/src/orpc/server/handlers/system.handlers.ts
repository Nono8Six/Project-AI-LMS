import { HealthOutput, TimeOutput, VersionOutput } from '@/orpc/contracts/system.contract';
import type { AppContext } from '@/orpc/server/context';

// Prefer app package version; fallback to env if provided
import appPkg from '../../../../package.json' with { type: 'json' };

function nowISO(): string {
  return new Date().toISOString();
}

function getVersion(): string {
  const envVersion = process.env.NEXT_PUBLIC_APP_VERSION;
  if (envVersion && envVersion.trim().length > 0) return envVersion;
  return appPkg.version ?? '0.0.0';
}

export async function healthHandler(_ctx: AppContext) {
  const out = { status: 'ok' as const, version: getVersion(), time: nowISO() };
  return HealthOutput.parse(out);
}

export async function timeHandler(_ctx: AppContext) {
  const out = { now: nowISO() };
  return TimeOutput.parse(out);
}

export async function versionHandler(_ctx: AppContext) {
  const out = { version: getVersion() };
  return VersionOutput.parse(out);
}

