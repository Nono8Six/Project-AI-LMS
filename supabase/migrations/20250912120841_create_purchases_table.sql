-- ============================================================================
-- MIGRATION: Creation table purchases (Historique Achats)
-- ============================================================================
-- Objectif: Source de verite des achats + acces produits avec tracking Stripe
-- PHASE 1 - SANS RLS - Version basique pour validation stack
-- ============================================================================

-- Table purchases - Historique complet des achats
CREATE TABLE public.purchases (
  -- Identifiants
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  
  -- Stripe tracking complet
  stripe_session_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  
  -- Donnees business
  amount_paid INTEGER NOT NULL, -- centimes pour precision
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- Etats paiement (lifecycle Stripe)
  status TEXT NOT NULL DEFAULT 'pending',
  refund_amount INTEGER DEFAULT 0,
  
  -- Parrainage (calcule au moment de l'achat)
  referrer_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  commission_rate DECIMAL(5,4), -- ex: 0.1250 = 12.5%
  commission_amount INTEGER, -- centimes
  
  -- Metadonnees Stripe completes
  stripe_metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  
  -- Audit trail complet
  completed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index critiques pour performance
CREATE INDEX idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX idx_purchases_product_id ON public.purchases(product_id);
CREATE INDEX idx_purchases_status ON public.purchases(status);
CREATE INDEX idx_purchases_referrer_id ON public.purchases(referrer_id);
CREATE INDEX idx_purchases_stripe_session ON public.purchases(stripe_session_id);
CREATE INDEX idx_purchases_created_at ON public.purchases(created_at);

-- Index business queries optimisees
CREATE INDEX idx_purchases_completed ON public.purchases(completed_at) 
  WHERE status = 'completed';
CREATE INDEX idx_purchases_commission ON public.purchases(referrer_id, commission_amount) 
  WHERE referrer_id IS NOT NULL AND commission_amount > 0;

-- Trigger updated_at automatique
CREATE TRIGGER purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- VALIDATION MIGRATION
-- ============================================================================
-- Cette migration doit:
-- - Creer la table purchases avec toutes relations
-- - Configurer les index de performance optimaux
-- - Preparer le tracking Stripe complet
-- - Supporter le systeme de parrainage
-- ============================================================================