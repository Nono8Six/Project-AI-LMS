-- ============================================================================
-- MIGRATION: Correction finale warning RLS system_settings
-- ============================================================================
-- Objectif: Éliminer le dernier warning de politiques RLS multiples
-- Problème: admin_manage_system_settings (ALL) et consolidated_select_system_settings (SELECT)
--           créent un conflit pour le rôle 'authenticated' sur l'action SELECT
-- Solution: Séparer les politiques admin en INSERT/UPDATE/DELETE (sans SELECT)
-- ============================================================================

-- ============================================================================
-- SUPPRESSION POLITIQUE CONFLICTUELLE
-- ============================================================================
DROP POLICY IF EXISTS "admin_manage_system_settings" ON public.system_settings;

-- ============================================================================
-- CRÉATION POLITIQUES ADMIN SPÉCIFIQUES (SANS SELECT)
-- ============================================================================

-- Politique INSERT pour admin
CREATE POLICY "admin_insert_system_settings" ON public.system_settings
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.get_user_role()) = 'admin');

-- Politique UPDATE pour admin
CREATE POLICY "admin_update_system_settings" ON public.system_settings
  FOR UPDATE
  TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin')
  WITH CHECK ((SELECT public.get_user_role()) = 'admin');

-- Politique DELETE pour admin
CREATE POLICY "admin_delete_system_settings" ON public.system_settings
  FOR DELETE
  TO authenticated
  USING ((SELECT public.get_user_role()) = 'admin');

-- ============================================================================
-- RÉSULTAT FINAL:
-- • consolidated_select_system_settings: SELECT pour anon + authenticated
-- • admin_insert_system_settings: INSERT pour authenticated (admin uniquement)
-- • admin_update_system_settings: UPDATE pour authenticated (admin uniquement)
-- • admin_delete_system_settings: DELETE pour authenticated (admin uniquement)
--
-- PLUS AUCUN CONFLIT: Une seule politique par action pour chaque rôle
-- ============================================================================

-- ============================================================================
-- VALIDATION FINALE
-- ============================================================================
-- Cette migration élimine:
-- ✅ Le dernier warning de politiques RLS multiples
-- ✅ Conflit entre ALL et SELECT pour rôle authenticated
-- ✅ Maintien de la sécurité: admin peut tout faire, autres voient settings publics
-- ✅ Performance optimale: 1 politique par action par rôle
-- ============================================================================