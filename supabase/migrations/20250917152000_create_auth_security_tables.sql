-- ============================================================================
-- MIGRATION: Tables persistance sécurité (brute force + rate limiting)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.auth_bruteforce_attempts (
  ip_address TEXT PRIMARY KEY,
  failure_count INTEGER NOT NULL DEFAULT 0,
  first_failure_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_failure_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  blocked_until TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_auth_bruteforce_attempts_updated
  BEFORE UPDATE ON public.auth_bruteforce_attempts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_auth_bruteforce_blocked_until
  ON public.auth_bruteforce_attempts (blocked_until)
  WHERE blocked_until IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.auth_rate_limit_counters (
  key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  requests INTEGER NOT NULL DEFAULT 0,
  limit_value INTEGER,
  endpoint TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_auth_rate_limit_window ON public.auth_rate_limit_counters(window_start);

ALTER TABLE public.auth_bruteforce_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_rate_limit_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_manage_bruteforce
  ON public.auth_bruteforce_attempts
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY service_role_manage_rate_limit
  ON public.auth_rate_limit_counters
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Pas d'accès pour anon/authed : gestion uniquement service role.
