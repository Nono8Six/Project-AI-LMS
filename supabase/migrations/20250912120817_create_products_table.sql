-- ============================================================================
-- MIGRATION: Creation table products (Catalogue Stripe)
-- ============================================================================
-- Objectif: Synchronisation catalogue Stripe + metadonnees business
-- PHASE 1 - SANS RLS - Version basique pour validation stack
-- ============================================================================

-- Table products - Catalogue avec synchronisation Stripe
CREATE TABLE public.products (
  -- Identifiants Stripe
  id TEXT PRIMARY KEY, -- Stripe Product ID
  stripe_price_id TEXT NOT NULL, -- Stripe Price ID principal
  
  -- Informations produit
  name TEXT NOT NULL,
  description TEXT,
  features JSONB NOT NULL DEFAULT '[]'::JSONB,
  
  -- Pricing (en centimes pour precision)
  price_amount INTEGER NOT NULL,
  price_currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Business logic
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  
  -- Metadonnees flexibles
  stripe_metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  internal_metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  
  -- Audit automatique
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index critiques pour performance
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_price_range ON public.products(price_amount);
CREATE INDEX idx_products_created_at ON public.products(created_at);

-- Trigger updated_at automatique
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- VALIDATION MIGRATION
-- ============================================================================
-- Cette migration doit:
-- - Creer la table products avec tous les champs
-- - Configurer les index de performance
-- - Activer trigger updated_at automatique
-- - Preparer synchronisation future avec Stripe
-- ============================================================================