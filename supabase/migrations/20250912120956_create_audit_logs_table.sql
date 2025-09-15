-- ============================================================================
-- MIGRATION: Creation table audit_logs (Trail d'Audit)
-- ============================================================================
-- Objectif: Tracabilite immutable toutes actions sensibles (append-only)
-- PHASE 1 - SANS RLS - Version basique pour validation stack
-- ============================================================================

-- Table audit_logs - Trail d'audit immutable
CREATE TABLE public.audit_logs (
  -- Identifiant unique
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Context utilisateur (peut etre null pour actions systeme)
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  
  -- Action tracking structure
  action TEXT NOT NULL, -- 'user.signup', 'purchase.completed', etc.
  resource_type TEXT NOT NULL, -- 'user', 'purchase', 'product', etc.
  resource_id TEXT, -- UUID ou ID de la ressource impactee
  
  -- Details action en JSON flexible
  details JSONB NOT NULL DEFAULT '{}'::JSONB,
  
  -- Context request pour investigation
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,
  
  -- Timestamp immutable (pas d'updated_at car append-only)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index critiques pour queries audit
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id) 
  WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_ip ON public.audit_logs(ip_address) 
  WHERE ip_address IS NOT NULL;

-- Index composite pour queries frequentes admin
CREATE INDEX idx_audit_logs_user_actions ON public.audit_logs(user_id, action, created_at DESC) 
  WHERE user_id IS NOT NULL;

-- ============================================================================
-- VALIDATION MIGRATION
-- ============================================================================
-- Cette migration doit:
-- - Creer la table audit_logs immutable (append-only)
-- - Configurer les index pour queries admin dashboard
-- - Supporter investigation securite et debugging
-- - Tracer toutes actions sensibles du systeme
-- ============================================================================