-- ============================================================================
-- MIGRATION: Enrichissement user_profiles - Version Complète
-- ============================================================================
-- Objectif: Ajouter colonnes role, status, referral, onboarding, consents
-- Sécurité: Contraintes strictes + triggers + index performance
-- Timeline: 30min max
-- ============================================================================

-- ============================================================================
-- AJOUT COLONNES user_profiles
-- ============================================================================

-- Colonne role (member par défaut, admin possible)
ALTER TABLE public.user_profiles ADD COLUMN role TEXT
  CHECK (role IN ('member', 'admin'))
  DEFAULT 'member'
  NOT NULL;

-- Colonne status (active par défaut)
ALTER TABLE public.user_profiles ADD COLUMN status TEXT
  CHECK (status IN ('active', 'suspended', 'pending_verification'))
  DEFAULT 'active'
  NOT NULL;

-- Colonne referral_code (unique, généré automatiquement)
ALTER TABLE public.user_profiles ADD COLUMN referral_code TEXT UNIQUE;

-- Colonne referrer_id (auto-référence pour système parrainage)
ALTER TABLE public.user_profiles ADD COLUMN referrer_id UUID
  REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- Colonnes onboarding
ALTER TABLE public.user_profiles ADD COLUMN onboarding_completed BOOLEAN
  DEFAULT FALSE
  NOT NULL;

ALTER TABLE public.user_profiles ADD COLUMN onboarding_completed_at TIMESTAMPTZ;

-- Colonne consents (JSONB avec valeurs par défaut)
ALTER TABLE public.user_profiles ADD COLUMN consents JSONB
  DEFAULT '{"marketing": false, "analytics": false, "cookies": true}'::jsonb
  NOT NULL;

-- ============================================================================
-- CONTRAINTES ADDITIONNELLES
-- ============================================================================

-- Contrainte cohérence onboarding
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_onboarding_coherence
  CHECK (
    (onboarding_completed = TRUE AND onboarding_completed_at IS NOT NULL) OR
    (onboarding_completed = FALSE AND onboarding_completed_at IS NULL)
  );

-- Contrainte structure consents
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_consents_structure
  CHECK (
    jsonb_typeof(consents) = 'object' AND
    consents ? 'marketing' AND
    consents ? 'analytics' AND
    consents ? 'cookies' AND
    jsonb_typeof(consents -> 'marketing') = 'boolean' AND
    jsonb_typeof(consents -> 'analytics') = 'boolean' AND
    jsonb_typeof(consents -> 'cookies') = 'boolean'
  );

-- Anti-fraude: pas d'auto-parrainage
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_no_self_referral
  CHECK (referrer_id != id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger updated_at automatique
DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trigger_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger génération automatique referral_code
CREATE OR REPLACE FUNCTION public.auto_generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Générer referral_code seulement si NULL
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;

  RETURN NEW;
END;
$$;

-- Appliquer trigger sur INSERT
DROP TRIGGER IF EXISTS trigger_user_profiles_referral_code ON public.user_profiles;
CREATE TRIGGER trigger_user_profiles_referral_code
  BEFORE INSERT ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_generate_referral_code();

-- ============================================================================
-- INDEX DE PERFORMANCE
-- ============================================================================

-- Index sur role pour politiques RLS admin
CREATE INDEX IF NOT EXISTS idx_user_profiles_role
  ON public.user_profiles(role);

-- Index sur status pour filtrage utilisateurs actifs
CREATE INDEX IF NOT EXISTS idx_user_profiles_status
  ON public.user_profiles(status)
  WHERE status != 'active';

-- Index sur referrer_id pour système parrainage
CREATE INDEX IF NOT EXISTS idx_user_profiles_referrer_id
  ON public.user_profiles(referrer_id);

-- Index sur onboarding_completed pour dashboard admin
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding_completed
  ON public.user_profiles(onboarding_completed)
  WHERE onboarding_completed = FALSE;

-- Index sur referral_code pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_code
  ON public.user_profiles(referral_code);

-- ============================================================================
-- MISE À JOUR FONCTION get_user_role()
-- ============================================================================

-- Mettre à jour get_user_role() pour utiliser la nouvelle colonne role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role
  FROM public.user_profiles
  WHERE id = (SELECT auth.uid())
  LIMIT 1;
$$;

-- ============================================================================
-- MISE À JOUR FONCTION generate_referral_code()
-- ============================================================================

-- Améliorer generate_referral_code() avec vérification unicité réelle
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    -- Générer code 6 caractères alphanumériques (hex = 6 chars)
    code := UPPER(encode(gen_random_bytes(3), 'hex'));

    -- Vérifier unicité dans user_profiles.referral_code
    SELECT EXISTS(
      SELECT 1 FROM public.user_profiles
      WHERE referral_code = code
    ) INTO exists_code;

    -- Sortir si unique
    IF NOT exists_code THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.auto_generate_referral_code() TO authenticated, service_role;

-- ============================================================================
-- VALIDATION MIGRATION
-- ============================================================================
-- Cette migration enrichit user_profiles avec:
-- ✅ 7 nouvelles colonnes (role, status, referral_code, referrer_id, onboarding_completed, onboarding_completed_at, consents)
-- ✅ 4 contraintes métier (cohérence onboarding, structure consents, anti-fraude)
-- ✅ 2 triggers (updated_at, referral_code auto)
-- ✅ 5 index de performance optimisés
-- ✅ 2 fonctions améliorées (get_user_role, generate_referral_code)
-- ✅ Architecture complète pour RBAC + système parrainage + onboarding
-- ============================================================================