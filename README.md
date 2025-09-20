# LMS IA - Plateforme d'Apprentissage Conversationnelle

La fondation technique est prête (RLS, orpc, services partagés), mais l'environnement reste à préparer systématiquement avant de lancer les tests ou de brancher des features métier.

## État du projet
- 🧱 Backend sécurisé : orpc + Supabase (RLS, audit, rate-limit) opérationnels
- ⚠️ Supabase local requis avant toute exécution de tests (`supabase start` impératif)
- 🧪 Suite de tests versionnée mais dépend d'un environnement `.env.test`
- 🛠️ UI métier et monitoring encore à construire

## Prérequis
- Node.js ≥ 22 (Corepack gère pnpm)
- Docker Desktop (Supabase CLI s'appuie sur Docker)
- Supabase CLI ≥ 2.39
- Git

## Installation
```bash
git clone <repository-url>
cd Project-AI-LMS
pnpm install
```

## Configuration des environnements
1. Copier les templates :
   ```bash
   cp .env.example .env
   cp .env.test.example .env.test   # fourni avec des valeurs de test sûres
   ```
2. Régénérer les vraies clés (Supabase + Stripe) pour `.env`. Ne jamais réutiliser celles du repo.
3. Lancer Supabase local :
   ```bash
   supabase start
   supabase db reset      # migrations + seed
   ```
4. Générer (facultatif) les types :
   ```bash
   pnpm run db:generate-types
   ```

## Démarrage développement
```bash
pnpm dev
# ou
pnpm dev:clean    # libère les ports avant lancement
```
Application accessible sur http://localhost:3000.

## Tests & Qualité
### Préparation obligatoire
- Supabase local doit être `running` (voir ci-dessus)
- Les tests utilisent automatiquement `.env.test`

### Commandes
```bash
pnpm --dir app lint            # ESLint (monorepo + app)
pnpm --dir app typecheck       # TypeScript strict
pnpm test                      # Vitest côté monorepo + app
pnpm test:coverage             # Couverture globale
pnpm test --filter route       # Vérifie health/auth/rate-limit (Supabase requis)
```

### Vérification des endpoints orpc
1. Lancer Supabase (`supabase start`)
2. S'assurer que `.env.test` contient les variables Supabase de test
3. Exécuter :
   ```bash
   pnpm test --filter route.rpc.health.test.ts
   pnpm test --filter route.auth.me.test.ts
   pnpm test --filter route.ratelimit.test.ts
   ```
Chaque test confirme que les endpoints renvoient 200 et propagent `x-request-id` + headers rate-limit.

## Maintenance rate-limit
Un script de maintenance supprime les compteurs obsolètes :
```bash
pnpm cleanup:rate-limit   # utilise SUPABASE_SERVICE_ROLE_KEY
```
À planifier dans une cron (toutes les heures par exemple) pour garder `auth_rate_limit_counters` sain.

## Scripts disponibles
| Script | Description |
| --- | --- |
| `pnpm dev` | Démarrage développement (App Router + Supabase requis) |
| `pnpm build` / `pnpm start` | Build/serveur prod |
| `pnpm lint` / `pnpm typecheck` | Qualité côté monorepo + app |
| `pnpm test` | Tests (vitest) |
| `pnpm supabase:start` / `pnpm supabase:stop` | Gestion Supabase local |
| `pnpm cleanup:rate-limit` | Purge des compteurs rate-limit obsolètes |

## Structure principale
```
Project-AI-LMS/
├── app/                # Application Next.js 15
│   ├── src/orpc/       # Contrats, handlers, middleware oRPC
│   ├── src/shared/     # Services, utils, types partagés
│   └── ...
├── supabase/           # Migrations SQL + seed + config
├── tests/              # env / integration / unit
├── docs/               # Stack technique, guide Supabase, audit
└── scripts/            # Utilitaires CLI (check-node, cleanup, ...)
```

## Architecture (rappel)
- Next.js 15 (RSC par défaut)
- orpc pour les endpoints (validation Zod & typage end-to-end)
- Supabase PostgreSQL (RLS activé, audit immutable, brute force & rate-limit)
- Tailwind + tokens HSL + shadcn/ui
- Vitest pour les tests unitaires/intégration

## Sécurité
- CSP stricte + nonce via middleware
- Headers de sécurité (HSTS, X-Frame-Options, …)
- Sessions Supabase avec TTL + révocation universelle
- Audit service centralisé (auth + sécurité)
- Rate-limit déterministe (observabilité incluse)

## Troubleshooting
| Problème | Solution |
| --- | --- |
| Tests échouent (`SERVICE_ROLE_NOT_CONFIGURED`) | Assurez-vous que Supabase tourne et que `.env.test` contient une clé service role de test |
| Ports occupés | `pnpm port:free` puis `pnpm dev:clean` |
| Base locale désynchronisée | `supabase stop && supabase start && supabase db reset` |
| Rate-limit gonflés | `pnpm cleanup:rate-limit` |

## Documentation
- `docs/STACK_TECHNIQUE.md` – Architecture détaillée (sans ancienne interface debug)
- `docs/SUPABASE_LOCAL.md` – Setup Supabase complet + rotation des secrets
- `docs/TODO/AUDIT_FIX_PLAN.md` – Roadmap de remédiation

## Contribution
Avant ouverture de PR :
1. `pnpm --dir app lint`
2. `pnpm --dir app typecheck`
3. `pnpm test` (Supabase actif)
4. Mise à jour de la doc si comportement modifié

---

Dernière mise à jour : septembre 2025
