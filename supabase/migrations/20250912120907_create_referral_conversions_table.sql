-- ============================================================================
-- MIGRATION: Creation table referral_conversions (Tracking Parrainage)
-- ============================================================================
-- Objectif: Historique detaille conversions parrainage + commissions
-- PHASE 1 - SANS RLS - Version basique pour validation stack
-- ============================================================================

-- Table referral_conversions - Tracking parrainage detaille
CREATE TABLE public.referral_conversions (
  -- Identifiants
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  
  -- Donnees conversion
  conversion_type TEXT NOT NULL DEFAULT 'first_purchase',
  
  -- Commission details (snapshot du moment)
  commission_rate DECIMAL(5,4) NOT NULL,
  commission_amount INTEGER NOT NULL, -- centimes
  purchase_amount INTEGER NOT NULL, -- centimes (reference)
  
  -- Etats commission
  commission_status TEXT NOT NULL DEFAULT 'pending',
  
  -- Paiement commission
  paid_at TIMESTAMPTZ,
  payment_method TEXT, -- 'bank_transfer', 'stripe', 'manual', etc.
  payment_reference TEXT,
  
  -- Audit & tracking
  approved_by UUID REFERENCES public.user_profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index critiques pour analytics
CREATE INDEX idx_referral_conversions_referrer ON public.referral_conversions(referrer_id);
CREATE INDEX idx_referral_conversions_referred_user ON public.referral_conversions(referred_user_id);
CREATE INDEX idx_referral_conversions_purchase ON public.referral_conversions(purchase_id);
CREATE INDEX idx_referral_conversions_status ON public.referral_conversions(commission_status);
CREATE INDEX idx_referral_conversions_created_at ON public.referral_conversions(created_at);

-- Index business queries optimisees
CREATE INDEX idx_referral_pending_commissions ON public.referral_conversions(referrer_id, commission_amount) 
  WHERE commission_status = 'pending';
CREATE INDEX idx_referral_paid_commissions ON public.referral_conversions(referrer_id, paid_at) 
  WHERE commission_status = 'paid';

-- Trigger updated_at automatique
CREATE TRIGGER referral_conversions_updated_at
  BEFORE UPDATE ON public.referral_conversions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- VALIDATION MIGRATION
-- ============================================================================
-- Cette migration doit:
-- - Creer la table referral_conversions avec toutes relations
-- - Configurer les index analytics optimaux
-- - Supporter le workflow de validation des commissions
-- - Tracer l'historique complet du parrainage
-- ============================================================================