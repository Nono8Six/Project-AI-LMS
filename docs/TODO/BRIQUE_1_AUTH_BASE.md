# Brique 1 – Auth Base (Plan)

## Vision
Déployer la couche Auth applicative (signup/login, onboarding, permissions) prête pour l’UI, sans encore livrer d’interface.

## Micro-tâches

### 1. Endpoints Signup/Login (Supabase + orpc)
- Implémenter `auth.signup` et `auth.login` (email/password) via Supabase Auth.
- Normalisation erreurs (Zod) + audit logging.
- Tests d’intégration Supabase : création user + session persistée dans `auth_sessions`.

### 2. Onboarding Workflow
- Endpoint `profile.completeOnboarding` (consents RGPD, profil complet).
- Middleware Next.js bloque l’accès si `onboarding_completed=false`.
- Tests intégration : utilisateur non onboardé redirigé, puis autorisé après completion.

### 3. Password Reset / Email Verification
- Exposer ORPC `auth.requestPasswordReset` / `auth.verifyOtp` (délégation Supabase).
- Audit `auth.password_reset` loggé.
- Tests Vitest (mocks Supabase) vérifiant les appels API.

### 4. Permissions Service V1
- Finaliser `PermissionService` (membre/admin) + cache invalidation.
- `auth.me` retourne permissions calculées.
- Tests unitaires couvrant matrix rôles/statuts.

### 5. Middleware Auth UX
- Étendre middleware :
  - Forcer onboarding.
  - Conserver CSP/headers sécurité.
- Tests E2E (Playwright ou supertest Next) avec Supabase local.

### 6. Documentation & Guides
- Mettre à jour `docs/ARCHITECTURE_COMPLETE_LMS_IA.md` (diagramme flux auth).
- README : procédure `pnpm test:auth` (voir tâche 7).

### 7. Préflight & CI
- Nouveau script `pnpm test:auth` (typecheck + tests auth + env).
- Étendre CI (documenté) : `supabase db reset` puis `pnpm test:auth`.

## Pré-requis
- Supabase local actif (`supabase start` + `supabase db reset`).
- Variables d’environnement complètes (`validateServerEnv`).
- Node ≥ 22.
