# TODO – Redressement base LMS IA

## Tâches Bloquantes (P0)
- [ ] Versionner tous les services/Utils partagés indispensables :
  - `app/src/shared/services/audit.service.ts`
  - `app/src/shared/services/permission.service.ts`
  - `app/src/shared/services/security.service.ts`
  - `app/src/shared/services/session.service.ts`
  - `app/src/shared/utils/security.ts`
- [ ] Ajouter au repo l’ensemble des migrations Supabase locales :
  - `supabase/migrations/20250915120000_enable_rls_all_tables.sql`
  - `supabase/migrations/20250915130000_enrich_user_profiles.sql`
  - `supabase/migrations/20250917150000_create_auth_sessions_table.sql`
  - `supabase/migrations/20250917152000_create_auth_security_tables.sql`
- [ ] Versionner toute la suite de tests (`tests/env`, `tests/integration`, `tests/unit`, etc.)
- [ ] Préparer un environnement de test reproductible :
  - `.env.test` (ou équivalent) avec les variables Supabase/SSE nécessaires
  - Mocks/faux clients pour exécuter `buildContext` sans 500
- [ ] Remplacer le nettoyage aléatoire du rate-limit (`Math.random() < 0.01`) par une purge déterministe (intervalle ou job)
- [ ] Exécuter et faire passer `pnpm --dir app lint`, `pnpm --dir app typecheck`, `pnpm test` une fois les fichiers versionnés et l’environnement de test en place

## Tâches Priorité 1 (P1)
- [ ] Mettre à jour la documentation (README, Stack Technique, etc.) pour refléter la suppression de l’ancienne interface debug et détailler le setup test/CI
- [ ] Ajouter `"types": ["vitest/globals"]` dans le `tsconfig.json` racine si besoin (rassurer après versionnage tests)
- [ ] Documenter dans `README`/`docs` la procédure de setup Supabase local + tests (scripts, dépendances, env)
- [ ] Vérifier que toutes les routes orpc (health/auth/rate-limit) répondent 200 en local et que les headers attendus (`x-request-id`, rate-limit) sont bien présents
- [ ] Ajouter des logs ciblés dans `buildContext` et les handlers oRPC pour diagnostiquer plus facilement les futures erreurs 500
- [ ] Introduire un cron/queue (ou script) pour nettoyer `auth_rate_limit_counters` de manière planifiée si solution pure-Next insuffisante

## Tâches Priorité 2 (P2)
- [ ] Finaliser/mettre à jour la checklist post-kickstart (docs/TODO, BACKLOG) après redressement
- [ ] Ajouter des tests d’intégration Supabase (ou e2e) une fois l’environnement stabilisé
- [ ] Mettre en place un monitoring/logging plus formel (remplaçant l’ancienne UI debug) ou au moins un plan pour l’observabilité
- [ ] Évaluer l’ajout d’un lint sur secrets (`git-secrets` ou pre-commit) pour éviter la réintroduction de clés dans `.env`
- [ ] Planifier une vérification régulière des migrations (ex : CI qui exécute `supabase db push` en dry-run)

## Suivi
- Actualiser cette liste après chaque livrable majeur
- Garder un journal des tests exécutés (lint/typecheck/test) dans les PRs
