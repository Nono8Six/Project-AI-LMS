-- ============================================================================
-- MIGRATION: Create auth_sessions table for session persistence
-- ============================================================================
-- Objectif : stocker l'état des sessions Supabase côté serveur (TTL + révocation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.auth_sessions (
  session_id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issued_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity TIMESTAMPTZ NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  revoked_reason TEXT,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON public.auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON public.auth_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_revoked_active
  ON public.auth_sessions(session_id)
  WHERE revoked = FALSE;

ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_manage_auth_sessions
  ON public.auth_sessions
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Aucun accès direct pour les rôles anon/authenticated : gestion 100% côté service role

