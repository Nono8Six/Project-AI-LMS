-- ============================================================================
-- MIGRATION: Enable RLS + Politiques Sécurisées (Toutes Tables)
-- ============================================================================
-- Objectif: Activer RLS avec politiques optimisées sur 6 tables
-- Sécurité: Politiques strictes par rôle + performance optimisée
-- Timeline: 45min max
-- ============================================================================

-- ============================================================================
-- ENABLE RLS SUR TOUTES LES TABLES
-- ============================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TABLE user_profiles: Politiques accès personnel + admin
-- ============================================================================

-- SELECT: Users voient leur propre profil
CREATE POLICY "users_select_own_profile" ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

-- INSERT: Users créent leur propre profil
CREATE POLICY "users_insert_own_profile" ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

-- UPDATE: Users modifient leur propre profil
CREATE POLICY "users_update_own_profile" ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- ADMIN: Accès complet pour admins
CREATE POLICY "admin_all_access_user_profiles" ON public.user_profiles
  FOR ALL
  TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin')
  WITH CHECK ((SELECT public.get_user_role()) = 'admin');

-- ============================================================================
-- TABLE products: Politiques public + service_role + admin
-- ============================================================================

-- SELECT: Public voit produits actifs uniquement
CREATE POLICY "public_select_active_products" ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- SELECT: Admin voit tous les produits
CREATE POLICY "admin_select_all_products" ON public.products
  FOR SELECT
  TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin');

-- ALL: Service role accès complet (webhooks)
CREATE POLICY "service_role_all_access_products" ON public.products
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE purchases: Politiques own data + service_role + admin
-- ============================================================================

-- SELECT: Users voient leurs propres achats
CREATE POLICY "users_select_own_purchases" ON public.purchases
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- SELECT: Admin voit tous les achats
CREATE POLICY "admin_select_all_purchases" ON public.purchases
  FOR SELECT
  TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin');

-- ALL: Service role accès complet (webhooks Stripe)
CREATE POLICY "service_role_all_access_purchases" ON public.purchases
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE referral_conversions: Politiques referrer/referred + service_role + admin
-- ============================================================================

-- SELECT: Users voient conversions où ils sont referrer OU referred
CREATE POLICY "users_select_own_referral_conversions" ON public.referral_conversions
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = referrer_id OR
    (SELECT auth.uid()) = referred_user_id
  );

-- SELECT: Admin voit toutes les conversions
CREATE POLICY "admin_select_all_referral_conversions" ON public.referral_conversions
  FOR SELECT
  TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin');

-- ALL: Service role accès complet
CREATE POLICY "service_role_all_access_referral_conversions" ON public.referral_conversions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE system_settings: Politiques public settings + admin
-- ============================================================================

-- SELECT: Public voit settings publics uniquement
CREATE POLICY "public_select_public_settings" ON public.system_settings
  FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- ALL: Admin accès complet aux settings
CREATE POLICY "admin_all_access_system_settings" ON public.system_settings
  FOR ALL
  TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin')
  WITH CHECK ((SELECT public.get_user_role()) = 'admin');

-- ============================================================================
-- TABLE audit_logs: Politiques own logs + service_role + admin (append-only)
-- ============================================================================

-- SELECT: Users voient leurs propres logs
CREATE POLICY "users_select_own_audit_logs" ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- SELECT: Admin voit tous les logs
CREATE POLICY "admin_select_all_audit_logs" ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin');

-- INSERT: Service role peut insérer des logs
CREATE POLICY "service_role_insert_audit_logs" ON public.audit_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Pas d'UPDATE/DELETE sur audit_logs (immutable by design)

-- ============================================================================
-- INDEX DE PERFORMANCE POUR RLS
-- ============================================================================

-- Index pour politiques user_profiles (déjà existant sur id via PK)

-- Index pour politiques products.status
CREATE INDEX IF NOT EXISTS idx_products_status
  ON public.products(status)
  WHERE status = 'active';

-- Index pour politiques purchases.user_id
CREATE INDEX IF NOT EXISTS idx_purchases_user_id
  ON public.purchases(user_id);

-- Index pour politiques referral_conversions
CREATE INDEX IF NOT EXISTS idx_referral_conversions_referrer_id
  ON public.referral_conversions(referrer_id);

CREATE INDEX IF NOT EXISTS idx_referral_conversions_referred_user_id
  ON public.referral_conversions(referred_user_id);

-- Index pour politiques system_settings.is_public
CREATE INDEX IF NOT EXISTS idx_system_settings_is_public
  ON public.system_settings(is_public)
  WHERE is_public = true;

-- Index pour politiques audit_logs.user_id
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
  ON public.audit_logs(user_id);

-- ============================================================================
-- VALIDATION MIGRATION RLS
-- ============================================================================
-- Cette migration active:
-- ✅ RLS sur 6 tables critiques
-- ✅ 18 politiques sécurisées par rôle
-- ✅ Performance optimisée (TO + SELECT auth.uid())
-- ✅ 7 index pour accélération RLS
-- ✅ Sécurité: own data + admin + service_role
-- ✅ Audit logs immutable (INSERT only)
-- ============================================================================