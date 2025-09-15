# Stack Technique et Architecture - LMS IA

## Vue d'ensemble

Architecture monolithique modulaire basée sur Next.js 15, organisée en monorepo avec séparation logique des domaines. L'application unifie l'expérience publique, membre et administration dans une seule base de code pour maximiser la réutilisabilité et simplifier le déploiement.

## Stack Technique

### Framework Principal

**Next.js 15 avec App Router**  
Choix motivé par le rendering hybride (SSR/SSG/ISR), l'optimisation automatique des performances, et le support natif du streaming. App Router permet une architecture basée sur les layouts imbriqués et les Server Components pour une meilleure performance.

**TypeScript 5.6**  
Indispensable pour la maintenabilité d'un projet solo. Détection des erreurs à la compilation, autocomplétion intelligente, et refactoring sécurisé.

### Base de Données et Backend

**Supabase (PostgreSQL 15)**  
Solution tout-en-un offrant base de données, authentification, stockage fichiers et temps réel. Choix stratégique pour le développement rapide avec RLS (Row Level Security) pour la sécurité en profondeur.

### Intelligence Artificielle

**Google Gemini Flash 2.5**  
Rapport coût/performance optimal pour l'évaluation conversationnelle. Fenêtre de contexte d'1M tokens permettant des sessions longues avec mémoire complète.

### Paiement

**Stripe**  
Standard de l'industrie pour les paiements. Gestion native des abonnements et webhooks pour l'automatisation.

### Vidéo

**Mux**  
Streaming adaptatif professionnel avec analytics détaillées essentielles pour le tracking de progression.

### UI/UX

**Tailwind CSS + shadcn/ui**  
Développement rapide avec composants accessibles et personnalisables. shadcn/ui fournit une base solide sans vendor lock-in.

## Architecture du Projet

```
lms-ia/
├── app/
│   ├── src/
│   │   ├── app/                        # Routes et pages
│   │   ├── components/                 # Composants React
│   │   ├── core/                       # Logique métier centrale
│   │   ├── features/                   # Fonctionnalités modulaires
│   │   └── shared/                     # Ressources partagées
│   ├── public/                         # Assets statiques
│   └── [configs]                       # Configurations
│
├── infrastructure/
│   ├── database/                       # Schémas et migrations
│   ├── supabase/                       # Configuration Supabase
│   └── scripts/                        # Automatisation
│
├── docs/                               # Documentation technique
└── [root configs]                      # Configuration monorepo
```

## Organisation Détaillée

### `/app/src/app` - Routes et Navigation

Structure basée sur les route groups de Next.js 15 pour une séparation logique claire:

```
app/
├── (public)/                           # Accès libre
│   ├── page.tsx                       # Landing page
│   ├── cours/[slug]/                  # Pages cours publiques
│   └── auth/                          # Authentification
│
├── (member)/                           # Accès authentifié
│   ├── dashboard/                     # Tableau de bord
│   ├── learn/                         # Espace apprentissage
│   │   └── [courseId]/[moduleId]/[lessonId]/
│   └── profile/                       # Gestion profil
│
├── (admin)/                            # Administration
│   ├── content/                       # Gestion contenu
│   ├── users/                         # Gestion utilisateurs
│   ├── ai/                            # Monitoring IA
│   └── analytics/                     # Tableaux de bord
│
└── api/                                # Routes API
    ├── rpc/                           # orpc - API end-to-end type-safe
    ├── webhooks/                      # Webhooks externes (Stripe, Supabase)
    └── internal/                      # API internes legacy
```

### `/app/src/components` - Système de Composants

Organisation par domaine et niveau de spécificité:

```
components/
├── ui/                                 # Primitives shadcn/ui
│   ├── button/
│   ├── dialog/
│   └── [autres primitives]
│
├── layouts/                            # Structures de page
│   ├── navigation/
│   ├── sidebar/
│   └── footer/
│
├── features/                           # Composants métier
│   ├── course/
│   ├── lesson/
│   ├── ai-chat/
│   └── payment/
│
└── widgets/                            # Composants composites
    ├── progress-tracker/
    ├── certificate-viewer/
    └── analytics-chart/
```

### `/app/src/core` - Cœur Métier

Architecture hexagonale pour l'isolation de la logique métier:

```
core/
├── domain/                             # Entités et logique métier
│   ├── entities/
│   ├── value-objects/
│   └── specifications/
│
├── application/                        # Cas d'usage
│   ├── use-cases/
│   ├── services/
│   └── dto/
│
├── infrastructure/                     # Implémentations
│   ├── repositories/
│   ├── external-services/
│   └── persistence/
│
└── presentation/                       # Adaptateurs UI
    ├── hooks/
    ├── contexts/
    └── providers/
```

### `/app/src/features` - Modules Fonctionnels

Chaque feature est autonome et contient tous ses éléments:

```
features/
├── ai-evaluation/
│   ├── components/                    # UI spécifique
│   ├── hooks/                         # Logique React
│   ├── services/                      # Services métier
│   ├── stores/                        # État local
│   ├── types/                         # Types TypeScript
│   └── utils/                         # Utilitaires
│
├── learning-path/
├── payment-processing/
├── content-management/
└── user-analytics/
```

### `/app/src/shared` - Ressources Transverses

```
shared/
├── constants/                          # Constantes globales
│   ├── config.ts
│   ├── limits.ts
│   └── routes.ts
│
├── types/                              # Types partagés
│   ├── global.d.ts
│   └── common.types.ts
│
├── utils/                              # Utilitaires
│   ├── formatters/
│   ├── validators/
│   └── helpers/
│
├── lib/                                # Configurations externes
│   ├── supabase/
│   ├── stripe/
│   └── gemini/
│
└── middleware/                         # Middlewares Next.js
    ├── auth.ts
    ├── rateLimit.ts
    └── roleGuard.ts
```

## Conventions et Standards

### Nommage des Fichiers

- **Composants**: PascalCase (`CourseCard.tsx`)
- **Utilitaires**: camelCase (`formatDate.ts`)
- **Types**: PascalCase avec extension `.types.ts`
- **Tests**: nom du fichier + `.test.ts` ou `.spec.ts`
- **Styles**: nom du composant + `.module.css` (si nécessaire)

### Structure des Composants

Chaque composant suit cette organisation:

```
ComponentName/
├── index.ts                           # Export public
├── ComponentName.tsx                   # Composant principal
├── ComponentName.types.ts              # Types
├── ComponentName.test.tsx              # Tests
├── ComponentName.module.css            # Styles (optionnel)
└── components/                         # Sous-composants
```

### Gestion d'État

- **État local**: useState pour l'UI simple
- **État complexe**: useReducer avec actions typées
- **État partagé**: Zustand pour la simplicité
- **État serveur**: orpc + TanStack Query pour l'état serveur type-safe

## orpc - API Framework End-to-End Type-Safe

### Pourquoi orpc vs Next.js API Routes

**orpc** est notre choix stratégique pour remplacer les API Routes Next.js natives et offrir une expérience développeur supérieure:

- **Type Safety End-to-End**: Validation automatique client ↔ serveur
- **Contract-First Development**: Un seul contrat partagé pour tout le système
- **Génération Client Automatique**: Plus de fetch manuel ni de types dupliqués
- **OpenAPI Native**: Documentation et validation automatiques
- **Middleware Puissant**: Auth, rate limiting, analytics intégrés
- **Performance Optimisée**: Lazy routing, streaming, cache intelligent

### Architecture orpc

**Structure organisée en 3 couches:**

```
orpc/
├── contracts/                          # Contrats API partagés
│   ├── auth.contract.ts               # Authentification & sessions
│   ├── courses.contract.ts            # Gestion cours et modules
│   ├── ai.contract.ts                 # Évaluations IA & conversations
│   ├── payments.contract.ts           # Stripe & facturation
│   ├── analytics.contract.ts          # Métriques & dashboards
│   └── index.ts                       # Export des contrats
│
├── server/                             # Implémentation serveur
│   ├── middleware/                    # Middleware orpc
│   │   ├── auth.middleware.ts         # Auth Supabase + RLS
│   │   ├── rateLimit.middleware.ts    # Protection DDoS
│   │   ├── analytics.middleware.ts    # Tracking événements
│   │   └── aiTokens.middleware.ts     # Suivi coûts IA
│   ├── handlers/                      # Handlers métier
│   │   ├── auth.handlers.ts           # Logic auth
│   │   ├── courses.handlers.ts        # Logic cours
│   │   └── ai.handlers.ts             # Logic IA
│   └── router.ts                      # Router principal
│
└── client/                            # Client généré
    ├── hooks/                         # React Query hooks
    ├── types/                         # Types auto-générés
    └── index.ts                       # Client configuré
```

### Intégrations Stack Techniques

**1. Supabase + orpc**
```typescript
// Middleware auth automatique
const supabaseAuth = orpc.use(async ({ context, next }) => {
  const { data: { user } } = await supabase.auth.getUser()
  return next({ context: { user, supabase } })
})

// RLS automatique via context
const getCourses = supabaseAuth.handler(async ({ context }) => {
  return context.supabase.from('courses')
    .select('*') // RLS automatique basé sur context.user
})
```

**2. TanStack Query + orpc**
```typescript
// Hooks auto-générés avec cache intelligent
const { useQuery, useMutation } = createReactQueryHooks<AppRouter>()

// Usage dans composants
const { data: courses } = useQuery(['courses.list'])
const createCourse = useMutation(['courses.create'])
```

**3. Stripe + orpc**
```typescript
// Webhooks typés et validés automatiquement
export const stripeWebhook = orpc
  .route({ method: 'POST', path: '/webhooks/stripe' })
  .input(StripeWebhookSchema)
  .handler(async ({ input }) => {
    // Validation Stripe automatique + types guarantis
  })
```

**4. Gemini IA + orpc**
```typescript
// Streaming + token tracking intégrés
export const aiEvaluation = orpc
  .use(aiTokensMiddleware)
  .input(z.object({ conversation: z.string() }))
  .handler(async ({ input, context }) => {
    // Streaming Gemini avec tracking tokens automatique
    return geminiService.streamEvaluation(input.conversation)
  })
```

**5. Next.js 15 App Router + orpc**
```typescript
// /api/rpc/[...orpc]/route.ts
import { RPCHandler } from '@orpc/server/fetch'

const handler = new RPCHandler(appRouter)

export const GET = handler.handle
export const POST = handler.handle
// ... autres méthodes
```

### Avantages vs Architecture Actuelle

| Aspect | Next.js API Routes | orpc |
|--------|-------------------|------|
| **Type Safety** | Types séparés manuels | End-to-end automatique |
| **Validation** | Zod manuel par route | Validation contrats automatique |
| **Client** | fetch + hooks manuels | Client auto-généré |
| **Documentation** | Manuelle | OpenAPI automatique |
| **Middleware** | Custom Next.js | Système intégré puissant |
| **Testing** | Mocking complexe | Contracts testables isolément |
| **Performance** | Standard | Optimisations intégrées |
| **DX** | Duplication types | Single source of truth |

## Services et Intégrations

### Architecture des Services

Chaque service externe est encapsulé dans une classe ou module dédié:

```
services/
├── ai/
│   ├── GeminiService.ts              # Intégration Gemini
│   ├── PromptManager.ts              # Gestion prompts
│   ├── TokenCounter.ts               # Calcul tokens
│   └── UsageTracker.ts               # Suivi consommation
│
├── payment/
│   ├── StripeService.ts              # Intégration Stripe
│   └── InvoiceGenerator.ts           # Génération factures
│
└── content/
    ├── MuxService.ts                  # Intégration Mux
    └── MDXProcessor.ts                # Traitement MDX
```

### Couches d'Abstraction

Trois niveaux d'abstraction pour la flexibilité:

1. **Interface** - Contrat définissant les méthodes
2. **Implementation** - Logique spécifique au service
3. **Adapter** - Transformation des données pour l'application

## Sécurité et Performance

### Sécurité Multi-Couches

1. **orpc Middleware Stack** - Auth, rate limiting, validation intégrés
2. **Middleware Edge** - Vérification avant traitement des requêtes
3. **Route Protection** - Guards au niveau des layouts + contrats orpc
4. **API Validation** - Schémas Zod automatiques via contrats orpc
5. **Database RLS** - Politiques Supabase + injection context orpc

### Optimisations Performance

- **Code Splitting** - Routes chargées à la demande
- **Image Optimization** - Next/Image avec lazy loading
- **Data Fetching** - Parallel fetching avec Promise.all
- **Caching Strategy** - ISR pour le contenu statique
- **Bundle Analysis** - Monitoring taille des bundles

## Environnements et Configuration

### Gestion des Environnements

```
Configuration/
├── .env.local                         # Développement local
├── .env.test                          # Tests automatisés
├── .env.staging                       # Pré-production
└── .env.production                    # Production
```

### Variables Critiques

- **Secrets** - Jamais dans le code, toujours en variables d'environnement
- **Configuration** - Centralisée dans `/shared/constants/config.ts`
- **Feature Flags** - Gérés via variables d'environnement

## Monitoring et Observabilité

### Logging Structuré

Utilisation de Pino ou Winston pour des logs structurés JSON avec niveaux:

- ERROR: Erreurs critiques
- WARN: Comportements anormaux
- INFO: Événements métier
- DEBUG: Développement uniquement

### Métriques Clés

- **Performance**: Core Web Vitals via Vercel Analytics
- **Erreurs**: Sentry pour le tracking d'erreurs
- **Usage IA**: Dashboard custom pour coûts et tokens
- **Business**: Mixpanel ou Amplitude pour les événements

## Workflow de Développement

### Branches Git

```
main                                    # Production
├── staging                            # Pré-production
└── develop                            # Développement
    └── feature/*                      # Features individuelles
```

### Scripts NPM

```
dev         → Développement local
build       → Build production
test        → Tests unitaires
test:e2e    → Tests end-to-end
lint        → Vérification code
format      → Formatage Prettier
typecheck   → Vérification TypeScript
analyze     → Analyse bundle
orpc:gen    → Génération client orpc
orpc:docs   → Génération documentation OpenAPI
```

## Migration vers orpc - Stratégie de Transition

### Phase de Migration Progressive

**Phase 1: Fondations (Actuelle)**
- ✅ Architecture Next.js 15 App Router stable
- ✅ Types Supabase Database complets
- ✅ Middleware auth existant
- ✅ TanStack Query hooks manuels

**Phase 2: Installation orpc**
```bash
# Packages orpc essentiels
pnpm add @orpc/contract @orpc/server @orpc/client
pnpm add @orpc/server/fetch @orpc/tanstack-query
pnpm add @orpc/otel @orpc/react  # Intégrations

# DevDependencies
pnpm add -D @orpc/openapi @orpc/hey-api
```

**Phase 3: Migration Contracts**
```typescript
// 1. Réutilisation types Database existants
import type { Database } from '@/shared/types/api.types'

// 2. Création contracts orpc basés sur architecture actuelle
export const coursesContract = orpc({
  list: {
    input: PaginatedRequestSchema,
    output: z.array(CourseSchema)
  },
  get: {
    input: z.object({ id: z.string() }),
    output: CourseSchema
  }
  // ... autres endpoints
})
```

**Phase 4: Implémentation Serveur**
```typescript
// Migration progressive handlers existants vers orpc
export const coursesRouter = orpc
  .use(supabaseAuthMiddleware)
  .use(rateLimitMiddleware)
  .contract(coursesContract)
  .implement({
    list: async ({ input, context }) => {
      // Réutilisation logique existante + context orpc
      return context.supabase.from('courses')
        .select('*')
        .range(input.page * input.limit, (input.page + 1) * input.limit)
    }
  })
```

**Phase 5: Migration Client Progressive**
```typescript
// Remplacement progressif des hooks TanStack Query manuels
// AVANT:
const useCoursesQuery = () => useQuery(['courses'], fetchCourses)

// APRÈS:
const { courses } = createReactQueryHooks<AppRouter>()
const { data } = courses.list.useQuery({ page: 0, limit: 10 })
```

**Phase 6: Coexistence Hybride**
- API Routes legacy maintenues en `/api/internal/`
- Nouvelles API orpc en `/api/rpc/`
- Migration progressive route par route
- Aucune breaking change côté frontend

### Points de Validation Migration

**✅ Critères de Succès par Phase**
- **Phase 2**: Installation packages, configuration de base
- **Phase 3**: Premier contract fonctionnel (ex: courses.list)
- **Phase 4**: Premier handler orpc avec middleware auth
- **Phase 5**: Premier hook client fonctionnel
- **Phase 6**: Coexistence stable legacy + orpc

**🔧 Outils de Migration**
- Script de génération contracts depuis types existants
- Tests automatiques de régression API
- Monitoring comparatif performance legacy vs orpc
- Documentation migration pour l'équipe

**⚠️ Risques et Mitigations**
- **Risque**: Breaking changes hooks existants
  - **Mitigation**: Coexistence progressive, feature flags
- **Risque**: Performance dégradée pendant transition
  - **Mitigation**: Monitoring continu, rollback possible
- **Risque**: Courbe d'apprentissage orpc
  - **Mitigation**: Formation équipe, documentation détaillée

## Scalabilité et Évolution

### Points d'Extension

L'architecture permet l'ajout facile de:

- Nouveaux types de contenu via le système de blocs
- Nouvelles intégrations IA via l'abstraction de service
- Nouveaux modes de paiement via les adapters
- Nouvelles features via les modules autonomes

### Migration Future

Structure préparée pour une évolution vers:

- Microservices si nécessaire (features déjà isolées)
- API publique (logique métier découplée)
- Application mobile (core réutilisable)
- Multi-tenancy (isolation des données déjà en place)
