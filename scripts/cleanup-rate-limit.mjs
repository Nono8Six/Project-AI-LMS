#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error('[cleanup-rate-limit] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const thresholdMs = Number(process.env.RATE_LIMIT_CLEANUP_THRESHOLD_MS || 60 * 60 * 1000);
const thresholdIso = new Date(Date.now() - thresholdMs).toISOString();

const client = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const { data, error, count } = await client
  .from('auth_rate_limit_counters')
  .delete()
  .lt('window_start', thresholdIso)
  .select('key,window_start', { count: 'exact' });

if (error) {
  console.error('[cleanup-rate-limit] Supabase error:', error.message);
  process.exit(1);
}

console.log(`[cleanup-rate-limit] Purged ${count || 0} rows older than ${thresholdIso}`);
if (process.env.NODE_ENV !== 'production' && data?.length) {
  console.log('[cleanup-rate-limit] Sample deleted keys:', data.slice(0, 5));
}
