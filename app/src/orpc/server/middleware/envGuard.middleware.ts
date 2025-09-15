import { validateServerEnv } from '@/shared/utils/env.server';
import type { AppContext } from '../context';

export function assertEnv(_ctx: AppContext): void {
  if (process.env.NODE_ENV === 'production') {
    validateServerEnv();
  }
}

// Body size is enforced by BodyLimitPlugin at adapter level.
