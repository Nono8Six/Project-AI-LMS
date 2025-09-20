-- =============================================================================
-- SEED DATA POUR DÉVELOPPEMENT LOCAL
-- =============================================================================
-- Settings système essentiels pour LMS IA
-- Aucune donnée fictive - uniquement configuration système minimale
-- Ce fichier est exécuté automatiquement après les migrations lors de `supabase db reset`

-- =============================================================================
-- SYSTEM SETTINGS ESSENTIELS (5 settings critiques)
-- =============================================================================

-- 1. SITE CONFIGURATION
INSERT INTO public.system_settings (key, value, value_type, description, is_public) VALUES
('site.name', '"LMS IA - Plateforme d''apprentissage conversationnelle"', 'string', 'Nom officiel de l''application', true),
('site.version', '"0.1.0"', 'string', 'Version actuelle de l''application', true),
('site.environment', '"development"', 'string', 'Environnement de déploiement', false);

-- 2. RATE LIMITING CONFIGURATION
INSERT INTO public.system_settings (key, value, value_type, description, is_public) VALUES
('rate_limit.default_requests_per_minute', '60', 'number', 'Limite par défaut requêtes/minute par IP', false),
('rate_limit.authenticated_requests_per_minute', '120', 'number', 'Limite requêtes/minute pour utilisateurs authentifiés', false);

-- 3. IA CONFIGURATION
INSERT INTO public.system_settings (key, value, value_type, description, is_public) VALUES
('ai.default_model', '"gemini-2.5-flash"', 'string', 'Modèle IA par défaut pour évaluations', false),
('ai.max_tokens_per_session', '50000', 'number', 'Limite tokens par session d''apprentissage', false),
('ai.cost_tracking_enabled', 'true', 'boolean', 'Activation du tracking des coûts IA', false);

-- 4. FEATURE FLAGS
INSERT INTO public.system_settings (key, value, value_type, description, is_public) VALUES
('features.test_navigation_enabled', 'true', 'boolean', 'Affichage navigation de test (NEXT_PUBLIC_ENABLE_TEST_NAV)', true);

-- 5. BUSINESS CONFIGURATION
INSERT INTO public.system_settings (key, value, value_type, description, is_public) VALUES
('business.default_referral_commission_rate', '0.15', 'number', 'Taux de commission parrainage par défaut (15%)', false),
('business.supported_currencies', '["EUR", "USD"]', 'array', 'Devises supportées pour les paiements', true),
('business.default_currency', '"EUR"', 'string', 'Devise par défaut pour l''affichage', true);

-- =============================================================================
-- VALIDATION SEEDS
-- =============================================================================
-- ✅ 13 settings système essentiels répartis en 5 domaines
-- ✅ Configuration minimale pour démarrage développement
-- ✅ Feature flags pour navigation test
-- ✅ Paramètres IA avec limites raisonnables
-- ✅ Configuration business (commission 15%, EUR par défaut)
-- ✅ Rate limiting adapté développement vs production
-- ✅ Respect principe "0 hardcode" via settings dynamiques
-- =============================================================================
