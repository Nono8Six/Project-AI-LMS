-- ============================================================================
-- MIGRATION: Creation table system_settings (Configuration Systeme)
-- ============================================================================
-- Objectif: Parametres configurables sans redeploiement, cle-valeur flexible
-- PHASE 1 - SANS RLS - Version basique pour validation stack
-- ============================================================================

-- Table system_settings - Configuration systeme flexible
CREATE TABLE public.system_settings (
  -- Identifiant unique
  key TEXT PRIMARY KEY,
  
  -- Valeur flexible JSON
  value JSONB NOT NULL,
  
  -- Metadonnees descriptives
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  
  -- Validation type pour coherence
  value_type TEXT NOT NULL,
  
  -- Securite et exposition
  is_public BOOLEAN NOT NULL DEFAULT false, -- expose cote client
  is_sensitive BOOLEAN NOT NULL DEFAULT false, -- logs masques
  
  -- Audit automatique
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour queries frequentes
CREATE INDEX idx_system_settings_category ON public.system_settings(category);
CREATE INDEX idx_system_settings_public ON public.system_settings(is_public) 
  WHERE is_public = true;
CREATE INDEX idx_system_settings_created_at ON public.system_settings(created_at);

-- Trigger updated_at automatique
CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- VALIDATION MIGRATION
-- ============================================================================
-- Cette migration doit:
-- - Creer la table system_settings avec validation type
-- - Configurer les index de performance
-- - Supporter exposition securisee cote client
-- - Preparer configuration flexible sans redeploiement
-- ============================================================================