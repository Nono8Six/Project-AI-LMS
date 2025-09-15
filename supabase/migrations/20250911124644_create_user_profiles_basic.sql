-- ============================================================================
-- MIGRATION: Creation table user_profiles basique
-- ============================================================================
-- Objectif: Premiere micro-etape ultra-securisee pour valider la chaine complete
-- Database -> Types -> Services -> orpc -> Tests SANS RIEN CASSER
-- ============================================================================

-- Table user_profiles ultra-minimale (extension auth.users)
-- PAS de RLS, PAS de contraintes complexes, PAS de foreign keys pour cette V1
CREATE TABLE public.user_profiles (
  -- Cle primaire liee a auth.users
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Donnees profil essentielles
  full_name TEXT NOT NULL,
  
  -- Audit automatique
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index essentiel pour performance
CREATE INDEX idx_user_profiles_created_at ON public.user_profiles(created_at);

-- ============================================================================
-- VALIDATION MIGRATION
-- ============================================================================
-- Cette migration doit:
-- ✅ Creer la table user_profiles avec 4 colonnes
-- ✅ Lier a auth.users avec CASCADE
-- ✅ Permettre la generation des types TypeScript
-- ✅ Ne rien casser dans l'architecture existante
-- ============================================================================