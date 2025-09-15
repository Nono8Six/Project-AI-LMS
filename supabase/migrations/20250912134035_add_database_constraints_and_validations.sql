-- ============================================================================
-- MIGRATION: Ajout contraintes et validations ultra-strictes
-- ============================================================================
-- Objectif: CORRIGER les problemes graves de validation detectes lors de l'audit
-- Cette migration ajoute TOUTES les contraintes manquantes pour un systeme PARFAIT
-- ============================================================================

-- ============================================================================
-- TABLE products: Contraintes business critiques
-- ============================================================================

-- Status valides uniquement
ALTER TABLE public.products ADD CONSTRAINT products_valid_status 
  CHECK (status IN ('active', 'inactive', 'archived'));

-- Categories valides uniquement  
ALTER TABLE public.products ADD CONSTRAINT products_valid_category 
  CHECK (category IN ('course', 'bundle', 'premium'));

-- Prix strictement positif
ALTER TABLE public.products ADD CONSTRAINT products_positive_price 
  CHECK (price_amount > 0);

-- Devises supportees uniquement
ALTER TABLE public.products ADD CONSTRAINT products_valid_currency 
  CHECK (price_currency IN ('EUR', 'USD'));

-- Features doit etre un array JSON valide
ALTER TABLE public.products ADD CONSTRAINT products_features_is_array 
  CHECK (jsonb_typeof(features) = 'array');

-- stripe_price_id format basique (commence par price_)
ALTER TABLE public.products ADD CONSTRAINT products_valid_stripe_price_id 
  CHECK (stripe_price_id ~ '^price_[a-zA-Z0-9_]+$');

-- Name non vide apres trim
ALTER TABLE public.products ADD CONSTRAINT products_name_not_empty 
  CHECK (LENGTH(TRIM(name)) > 0);

-- ============================================================================
-- TABLE purchases: Contraintes systeme paiement ultra-strictes
-- ============================================================================

-- Status paiement valides uniquement (lifecycle Stripe)
ALTER TABLE public.purchases ADD CONSTRAINT purchases_valid_status 
  CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'partially_refunded'));

-- Montant paye strictement positif
ALTER TABLE public.purchases ADD CONSTRAINT purchases_positive_amount 
  CHECK (amount_paid > 0);

-- Commission rate entre 0 et 50% maximum
ALTER TABLE public.purchases ADD CONSTRAINT purchases_valid_commission_rate 
  CHECK (commission_rate IS NULL OR (commission_rate >= 0 AND commission_rate <= 0.5));

-- Commission amount coherent avec rate et amount_paid
ALTER TABLE public.purchases ADD CONSTRAINT purchases_commission_coherent 
  CHECK (
    commission_amount IS NULL OR 
    (commission_amount >= 0 AND commission_amount <= amount_paid)
  );

-- Refund amount entre 0 et amount_paid
ALTER TABLE public.purchases ADD CONSTRAINT purchases_valid_refund_amount 
  CHECK (refund_amount >= 0 AND refund_amount <= amount_paid);

-- Coherence status completed et completed_at
ALTER TABLE public.purchases ADD CONSTRAINT purchases_completed_coherence 
  CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR
    (status != 'completed' AND completed_at IS NULL)
  );

-- Coherence status refund et refunded_at
ALTER TABLE public.purchases ADD CONSTRAINT purchases_refund_coherence 
  CHECK (
    (status IN ('refunded', 'partially_refunded') AND refunded_at IS NOT NULL) OR
    (status NOT IN ('refunded', 'partially_refunded') AND refunded_at IS NULL)
  );

-- Session ID Stripe format valide
ALTER TABLE public.purchases ADD CONSTRAINT purchases_valid_stripe_session 
  CHECK (stripe_session_id ~ '^cs_[a-zA-Z0-9_]+$');

-- Customer ID Stripe format valide  
ALTER TABLE public.purchases ADD CONSTRAINT purchases_valid_stripe_customer 
  CHECK (stripe_customer_id ~ '^cus_[a-zA-Z0-9_]+$');

-- Currency valide
ALTER TABLE public.purchases ADD CONSTRAINT purchases_valid_currency 
  CHECK (currency IN ('EUR', 'USD'));

-- ============================================================================
-- TABLE referral_conversions: Contraintes anti-fraude et business
-- ============================================================================

-- Status commission valides
ALTER TABLE public.referral_conversions ADD CONSTRAINT referral_valid_commission_status 
  CHECK (commission_status IN ('pending', 'approved', 'paid', 'cancelled'));

-- Type conversion valides
ALTER TABLE public.referral_conversions ADD CONSTRAINT referral_valid_conversion_type 
  CHECK (conversion_type IN ('first_purchase', 'additional_purchase'));

-- Commission rate strictement positif et <= 50%
ALTER TABLE public.referral_conversions ADD CONSTRAINT referral_valid_commission_rate 
  CHECK (commission_rate > 0 AND commission_rate <= 0.5);

-- Commission amount strictement positif
ALTER TABLE public.referral_conversions ADD CONSTRAINT referral_positive_commission_amount 
  CHECK (commission_amount > 0);

-- Purchase amount strictement positif
ALTER TABLE public.referral_conversions ADD CONSTRAINT referral_positive_purchase_amount 
  CHECK (purchase_amount > 0);

-- Commission amount <= purchase amount (logique)
ALTER TABLE public.referral_conversions ADD CONSTRAINT referral_commission_logical 
  CHECK (commission_amount <= purchase_amount);

-- Anti-fraude: pas d'auto-parrainage
ALTER TABLE public.referral_conversions ADD CONSTRAINT referral_no_self_referral 
  CHECK (referrer_id != referred_user_id);

-- Coherence status paid et paid_at
ALTER TABLE public.referral_conversions ADD CONSTRAINT referral_paid_coherence 
  CHECK (
    (commission_status = 'paid' AND paid_at IS NOT NULL) OR
    (commission_status != 'paid' AND paid_at IS NULL)
  );

-- Coherence status approved/paid et approved_by/approved_at
ALTER TABLE public.referral_conversions ADD CONSTRAINT referral_approval_coherence 
  CHECK (
    (commission_status IN ('approved', 'paid') AND approved_by IS NOT NULL AND approved_at IS NOT NULL) OR
    (commission_status NOT IN ('approved', 'paid') AND approved_by IS NULL AND approved_at IS NULL)
  );

-- ============================================================================
-- TABLE system_settings: Contraintes configuration stricte
-- ============================================================================

-- Value type valides uniquement
ALTER TABLE public.system_settings ADD CONSTRAINT settings_valid_value_type 
  CHECK (value_type IN ('string', 'number', 'boolean', 'object', 'array'));

-- Coherence entre value_type et valeur JSON reelle
ALTER TABLE public.system_settings ADD CONSTRAINT settings_value_type_coherence 
  CHECK (
    (value_type = 'string' AND jsonb_typeof(value) = 'string') OR
    (value_type = 'number' AND jsonb_typeof(value) = 'number') OR
    (value_type = 'boolean' AND jsonb_typeof(value) = 'boolean') OR
    (value_type = 'object' AND jsonb_typeof(value) = 'object') OR
    (value_type = 'array' AND jsonb_typeof(value) = 'array')
  );

-- Key non vide et format valide (snake_case avec points)
ALTER TABLE public.system_settings ADD CONSTRAINT settings_valid_key_format 
  CHECK (key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$' AND LENGTH(key) <= 100);

-- Category non vide
ALTER TABLE public.system_settings ADD CONSTRAINT settings_category_not_empty 
  CHECK (LENGTH(TRIM(category)) > 0);

-- ============================================================================
-- TABLE audit_logs: Contraintes audit trail strict
-- ============================================================================

-- Action format: namespace.operation (ex: user.signup, purchase.completed)
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_valid_action_format 
  CHECK (action ~ '^[a-z_]+\.[a-z_]+$');

-- Resource type non vide et lowercase
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_valid_resource_type 
  CHECK (resource_type ~ '^[a-z_]+$' AND LENGTH(resource_type) > 0);

-- Details est toujours un objet JSON
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_details_is_object 
  CHECK (jsonb_typeof(details) = 'object');

-- ============================================================================
-- CONTRAINTES INTER-TABLES (coherence referentielle business)
-- ============================================================================

-- Une seule conversion par achat (deja en UNIQUE mais explicite)
-- (Deja couvert par UNIQUE(purchase_id) dans referral_conversions)

-- Un seul achat par utilisateur par produit (anti-duplicate business)
ALTER TABLE public.purchases ADD CONSTRAINT purchases_unique_user_product 
  UNIQUE(user_id, product_id);

-- ============================================================================
-- VALIDATION FINALE MIGRATION
-- ============================================================================
-- Cette migration ajoute:
-- - 25+ contraintes CHECK critiques
-- - Validations format Stripe
-- - Anti-fraude systeme parrainage  
-- - Coherence timestamps/status
-- - Contraintes inter-tables business
-- - Validation JSON stricte
-- ============================================================================