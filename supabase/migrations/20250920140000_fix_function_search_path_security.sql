-- ============================================================================
-- MIGRATION: Fix Function Search Path Security
-- ============================================================================
-- Objectif: Corriger la vulnérabilité de sécurité search_path sur les fonctions
-- Référence: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
-- CRITICAL: SET search_path = '' pour empêcher les attaques par injection de schéma
-- ============================================================================

-- ============================================================================
-- SUPPRESSION DES TRIGGERS ET FONCTIONS EXISTANTES (pour éviter conflits)
-- ============================================================================
-- Supprimer tous les triggers qui dépendent des fonctions
DROP TRIGGER IF EXISTS audit_purchase_changes ON public.purchases;
DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS trigger_user_profiles_referral_code ON public.user_profiles;
DROP TRIGGER IF EXISTS products_updated_at ON public.products;
DROP TRIGGER IF EXISTS purchases_updated_at ON public.purchases;
DROP TRIGGER IF EXISTS referral_conversions_updated_at ON public.referral_conversions;
DROP TRIGGER IF EXISTS system_settings_updated_at ON public.system_settings;
DROP TRIGGER IF EXISTS trg_auth_bruteforce_attempts_updated ON public.auth_bruteforce_attempts;

-- Supprimer seulement les fonctions qui ont des conflits de types
DROP FUNCTION IF EXISTS public.get_pending_commissions(UUID);
DROP FUNCTION IF EXISTS public.get_product_stats(TEXT);
DROP FUNCTION IF EXISTS public.audit_purchase_changes();

-- Les autres fonctions seront remplacées avec CREATE OR REPLACE (pas de conflits de types)

-- ============================================================================
-- FONCTION: handle_updated_at() - Trigger automatique updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- FONCTION: generate_referral_code() - Génération codes parrainage uniques
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    -- Générer code 6 caractères alphanumériques
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
-- FONCTION: get_user_role() - Récupération rôle utilisateur courant
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Récupérer le rôle depuis user_profiles pour l'utilisateur authentifié
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE id = auth.uid();

  -- Retourner 'member' par défaut si pas de rôle défini
  RETURN COALESCE(user_role, 'member');
END;
$$;

-- ============================================================================
-- FONCTION: auto_generate_referral_code() - Trigger génération auto code
-- ============================================================================
CREATE OR REPLACE FUNCTION public.auto_generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Si referral_code est NULL, générer automatiquement
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- FONCTION: get_pending_commissions() - Calcul commissions en attente
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_pending_commissions(referrer_uuid UUID)
RETURNS TABLE(
  total_pending_amount NUMERIC,
  pending_count INTEGER,
  oldest_pending_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(rc.commission_amount), 0) as total_pending_amount,
    COUNT(*)::INTEGER as pending_count,
    MIN(rc.created_at) as oldest_pending_date
  FROM public.referral_conversions rc
  WHERE rc.referrer_id = referrer_uuid
    AND rc.commission_status = 'pending';
END;
$$;

-- ============================================================================
-- FONCTION: get_product_stats() - Statistiques produit par Stripe ID
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_product_stats(product_stripe_id TEXT)
RETURNS TABLE(
  total_sales INTEGER,
  total_revenue NUMERIC,
  active_subscriptions INTEGER,
  conversion_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(p.id)::INTEGER as total_sales,
    COALESCE(SUM(p.amount), 0) as total_revenue,
    COUNT(CASE WHEN p.status = 'completed' THEN 1 END)::INTEGER as active_subscriptions,
    CASE
      WHEN COUNT(*) > 0 THEN
        (COUNT(CASE WHEN p.status = 'completed' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100
      ELSE 0
    END as conversion_rate
  FROM public.purchases p
  INNER JOIN public.products prod ON p.product_id = prod.id
  WHERE prod.stripe_product_id = product_stripe_id;
END;
$$;

-- ============================================================================
-- FONCTION: audit_purchase_changes() - Trigger audit des changements d'achat
-- ============================================================================
CREATE OR REPLACE FUNCTION public.audit_purchase_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  action_type TEXT;
  old_data JSONB;
  new_data JSONB;
BEGIN
  -- Déterminer le type d'action
  IF TG_OP = 'INSERT' THEN
    action_type := 'purchase.created';
    old_data := NULL;
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'purchase.updated';
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'purchase.deleted';
    old_data := to_jsonb(OLD);
    new_data := NULL;
  END IF;

  -- Insérer dans audit_logs
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    created_at
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    action_type,
    'purchase',
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'old_data', old_data,
      'new_data', new_data,
      'operation', TG_OP
    ),
    now()
  );

  -- Retourner la ligne appropriée selon l'opération
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- ============================================================================
-- MISE À JOUR DES PERMISSIONS
-- ============================================================================

-- Permissions pour les fonctions utilitaires
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_referral_code() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.auto_generate_referral_code() TO authenticated, service_role;

-- Permissions pour les fonctions de stats (service_role et admin uniquement)
GRANT EXECUTE ON FUNCTION public.get_pending_commissions(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_product_stats(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.audit_purchase_changes() TO service_role;

-- ============================================================================
-- RECRÉRATION DES TRIGGERS
-- ============================================================================

-- Trigger pour MAJ automatique updated_at sur user_profiles
CREATE TRIGGER trigger_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger pour génération automatique referral_code sur user_profiles
CREATE TRIGGER trigger_user_profiles_referral_code
  BEFORE INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_referral_code();

-- Trigger pour audit des changements sur purchases
CREATE TRIGGER audit_purchase_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_purchase_changes();

-- Recréer tous les autres triggers updated_at
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER referral_conversions_updated_at
  BEFORE UPDATE ON public.referral_conversions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_auth_bruteforce_attempts_updated
  BEFORE UPDATE ON public.auth_bruteforce_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- VALIDATION MIGRATION SEARCH_PATH
-- ============================================================================
-- Cette migration sécurise:
-- ✅ 7 fonctions avec SET search_path = ''
-- ✅ Protection contre injection de schéma PostgreSQL
-- ✅ Permissions appropriées par rôle
-- ✅ SECURITY DEFINER avec search_path fixe
-- ✅ Triggers recréés avec fonctions sécurisées
-- ✅ Conformité au linter Supabase (0011_function_search_path_mutable)
-- ============================================================================