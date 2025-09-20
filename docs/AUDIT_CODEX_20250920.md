# Audit Codex – 20/09/2025

## Score global
- **56 / 100** – l’ossature RSC/oRPC et la couche Supabase restent solides, mais le dépôt est encore loin d’une base « prête à livrer » : plusieurs fichiers critiques ne sont pas versionnés, des secrets traînent en clair et l’expérience de test se casse immédiatement faute d’environnement préparé.
- Confrontation avec l’audit senior (`docs/AUDIT_TECHNIQUE_SENIOR.md`) : nous avons revu chaque alerte. Certaines sont confirmées (tests qui partent en erreur 500 faute d’environnement, modules essentiels absents du repo) et d’autres ne sont plus d’actualité (ex. `tsconfig.json` contient déjà `"types": ["vitest/globals"]`). Les constats vérifiés sont intégrés ci-dessous.

## Points forts
- RLS appliqué et documenté sur l’ensemble des tables métiers (`supabase/migrations/20250915120000_enable_rls_all_tables.sql`).
- Pipeline oRPC lisible et bien factorisé (auth + rate-limit + observabilité) (`app/src/orpc/server/router.ts`, `app/src/app/api/rpc/[...orpc]/route.ts`).
- Middleware HTTP verrouillé (CSP + headers, dérivation du nonce) (`app/middleware.ts`, `app/src/shared/utils/security.ts`).
- Design system unifié par tokens HSL (cf. `app/src/app/globals.css`, `app/tailwind.config.ts`).
- Batteries de tests ciblées (env, rate-limit, services) déjà prêtes dans `tests/` malgré leur état non versionné.

## Bloquants / Non-conformités vérifiés
1. **Fichiers essentiels non versionnés** – `git ls-files` confirme que `app/src/shared/services/audit.service.ts`, `permission.service.ts`, `security.service.ts`, `session.service.ts`, `app/src/shared/utils/security.ts` et l’intégralité des suites `tests/**` sont encore hors VCS (`git status` les signale en `??`). Les handlers oRPC (`app/src/orpc/server/handlers/auth.handlers.ts:5`) en dépendent : un clone du repo ne buildera pas.
2. **Migrations Supabase manquantes** – même problème pour `supabase/migrations/20250915120000_enable_rls_all_tables.sql`, `20250915130000_enrich_user_profiles.sql`, `20250917150000_create_auth_sessions_table.sql`, `20250917152000_create_auth_security_tables.sql` : elles existent localement mais ne sont pas suivies. La base n’est donc pas reproductible.
3. **Secrets exposés dans `.env`** – anonymes, service role, JWT, Stripe webhook sont toujours présents (`.env` lignes 14–34). Ils doivent être régénérés et documentés (cf. règle “no secrets”).
4. **Nettoyage rate-limit aléatoire** – `Math.random() < 0.01` dans `app/src/orpc/server/middleware/rateLimit.middleware.ts:60` rend le cycle de nettoyage imprévisible. Les compteurs restent en base et faussent les quotas/tests.
5. **Tests orpc → erreurs 500 sans configuration** – les tests `tests/route.rpc.health.test.ts`, `tests/route.auth.me.test.ts`, `tests/route.ratelimit.test.ts` importent directement le handler Next (`POST`). Lorsqu’on exécute `POST`, `buildContext` appelle `getAdminClient()` qui exige `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. Sans `.env.test` ou mock, on obtient `SERVICE_ROLE_NOT_CONFIGURED` → réponse 500, exactement ce que rapporte l’audit senior.
6. **Vitest globals** – vérification faite : `tsconfig.json` racine contient bien `"types": ["vitest/globals"]`. L’erreur `afterEach is not defined` ne se reproduira qu’en l’absence de suivi des fichiers tests eux-mêmes. À revalider une fois les fichiers ajoutés au repo.

## Axes d’amélioration prioritaires
1. **Versionner tout ce qui manque** : services partagés, utils, migrations, tests. Ensuite relancer `git ls-files app/src/shared/services/…` pour s’assurer que chaque import correspond à un fichier suivi.
2. **Sécurité des secrets** : régénérer clés Supabase/Stripe, purger `.env`, mettre à jour `.env.example` et `docs/SUPABASE_LOCAL.md` pour rappeler la rotation.
3. **Rate-limit cleanup maîtrisé** : remplacer le tirage aléatoire par une purge déterministe (`updated_at < now() - interval '1 hour'`) ou planifier un job.
4. **Tests orpc** : fournir un `.env.test` ou un mock Supabase (ex. injection via `buildContext`) pour éviter les 500. Documenter la procédure dans `README`/`docs/`.
5. **Doc et scripts** : retirer les références à l’ancienne UI debug, préciser comment préparer l’environnement de test (variables nécessaires, scripts `pnpm`).
6. **Qualité outillée** : une fois les fichiers versionnés, exécuter `pnpm --dir app lint`, `pnpm --dir app typecheck` et `pnpm test` pour obtenir un signal fiable.

## Observations Supabase
- Les scripts SQL montrent une excellente modélisation (contraintes, triggers, RLS par rôle) mais tant qu’ils ne sont pas commités, le projet ne peut pas être synchronisé.
- `supabase/seed.sql` reste minimal et conforme ; à versionner pour garantir la cohérence des settings.

## Méthodologie
- Lecture du workspace `main` (dirty). Aucune commande pnpm exécutée (politique « never »), mais inspection ciblée des fichiers, migrations et tests.
- Confrontation systématique avec `docs/AUDIT_TECHNIQUE_SENIOR.md` : chaque point a été vérifié manuellement et l’audit Codex mis à jour en conséquence (confirmations, rectifications, plan d’action).

## Recommandation globale
Tant que les services/migrations/tests ne sont pas dans Git et que le setup test/Secrets n’est pas sécurisé, la base reste non reproductible et sujette à des 500 dès qu’on lance les tests. Une fois ces chantiers réglés, le socle (RLS, pipeline oRPC, middleware) aura de quoi évoluer sereinement.
