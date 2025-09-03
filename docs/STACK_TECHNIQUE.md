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
    ├── trpc/                          # API typée (optionnel)
    ├── webhooks/                      # Webhooks externes
    └── internal/                      # API internes
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
- **État serveur**: TanStack Query pour le cache et la synchronisation

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

1. **Middleware Edge** - Vérification avant traitement
2. **Route Protection** - Guards au niveau des layouts
3. **API Validation** - Schémas Zod sur toutes les entrées
4. **Database RLS** - Politiques au niveau base de données

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
```

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
