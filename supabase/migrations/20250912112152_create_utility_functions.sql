-- ============================================================================
-- MIGRATION: Fonctions utilitaires PostgreSQL
-- ============================================================================
-- Objectif: Fonctions systeme essentielles pour automatisation et helpers
-- PHASE 1 - SANS RLS - Fonctions de base pour les tables suivantes
-- ============================================================================

-- ============================================================================
-- FONCTION 1: handle_updated_at()
-- ============================================================================
-- Fonction trigger pour MAJ automatique du champ updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Permissions appropriees
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO authenticated, service_role;

-- ============================================================================
-- FONCTION 2: generate_referral_code()
-- ============================================================================
-- Generation codes parrainage uniques (6 caracteres alphanumeriques)
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
    -- Generer code 6 caracteres alphanumeriques (hex = 6 chars)
    code := UPPER(encode(gen_random_bytes(3), 'hex'));
    
    -- Note: Version PHASE 1 - colonne referral_code pas encore ajoutee
    -- Pour l'instant, on genere juste un code unique (pas de verification en base)
    exists_code := false;
    
    -- Sortir si unique
    IF NOT exists_code THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.generate_referral_code() TO authenticated, service_role;

-- ============================================================================
-- FONCTION 3: get_user_role()
-- ============================================================================
-- Helper securise recuperation role utilisateur connecte
-- Note: Version PHASE 1 - retourne 'member' par defaut car colonne role pas encore ajoutee
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT CASE 
    WHEN EXISTS(SELECT 1 FROM public.user_profiles WHERE id = (SELECT auth.uid())) 
    THEN 'member'  -- Par defaut en attendant ajout colonne role
    ELSE NULL 
  END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated, service_role;

-- ============================================================================
-- VALIDATION MIGRATION
-- ============================================================================
-- Cette migration doit:
-- - Creer 3 fonctions utilitaires
-- - Configurer permissions appropriees
-- - Preparer l'infrastructure pour les tables suivantes
-- ============================================================================