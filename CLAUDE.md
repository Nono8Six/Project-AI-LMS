# CLAUDE.md

Ce fichier fournit des directives à Claude Code (claude.ai/code) pour travailler efficacement sur ce repository.

## Exigences Non Négociables

- Zéro hardcode: couleurs via tokens CSS (HSL vars), routes via `@/shared/constants/routes`, domaines/URLs via ENV uniquement.
- Zéro mock/skeleton/marketing par défaut. Exception uniquement sur demande explicite de l’utilisateur.
- Un seul `.env` (racine) chargé par `app/next.config.ts`. `NEXT_PUBLIC_*` côté client uniquement. Variables validées (Zod).
- RSC par défaut; `use client` seulement si requis (Radix/shadcn interactions).
- Sécurité: CSP stricte en prod (sans `unsafe-*`), `images.domains`/`connect-src` issus d’ENV, SVG dangereux désactivés.
- Qualité: `pnpm typecheck` + `pnpm lint` obligatoires; Tailwind via tokens; shadcn/ui sans overrides non typés.
- DX: Node ≥ 22, scripts utilitaires (`check:node`, `dev:clean`, `port:free`).
- QA liens: `NEXT_PUBLIC_ENABLE_TEST_NAV` (layouts), désactivé en prod.

## Aperçu du Projet

### 1.1 Énoncé de Vision

Créer la première plateforme française d'apprentissage qui utilise l'intelligence artificielle conversationnelle pour personnaliser en temps réel le parcours pédagogique de chaque apprenant. Notre système ne se contente pas de diffuser du contenu : il dialogue, évalue, s'adapte et garantit une vraie compréhension avant chaque progression.

### 1.2 Objectifs Principaux

**Objectif pédagogique**: Amener chaque apprenant de débutant complet en IA à utilisateur autonome et avancé, avec un taux de complétion supérieur à 70% (versus 15% de moyenne dans l'industrie) grâce à l'adaptation personnalisée de l'intelligence artificielle.

**Objectif business**: Atteindre 1000 utilisateurs payants dans les 6 premiers mois avec un panier moyen de 47€ et un taux de conversion visiteur vers acheteur de 3%.

**Objectif technique**: Développer une architecture modulaire permettant l'ajout rapide de nouveaux cours et formats d'interaction sans refonte du système, tout en gardant une simplicité maximale pour un développeur solo non expérimenté.

### 1.3 Principes Directeurs

- **Simplicité avant tout**: Chaque fonctionnalité doit être compréhensible par un utilisateur non-technique et implémentable par un développeur débutant
- **Pédagogie adaptative**: L'IA ne juge pas, elle accompagne et s'adapte au rythme de chacun avec bienveillance
- **Validation par la pratique**: La compréhension théorique est toujours validée par une mise en pratique concrète
- **Transparence du progrès**: L'apprenant sait toujours où il en est et ce qu'il lui reste à accomplir
- **Économie maîtrisée**: Chaque interaction IA est optimisée pour minimiser les coûts tout en maximisant la valeur pédagogique
- **Mono‑app V1**: Monorepo conservé; admin intégré dans la même application Next.js
- **Auth V1**: Supabase Auth avec Magic Link + Google OAuth

## Architecture & Stack Technique

**Référence complète** : @docs/STACK_TECHNIQUE.md

### Technologies Principales

- **Next.js 15** avec App Router (React Server Components)
- **TypeScript 5.6** pour la sécurité des types
- **Supabase** (PostgreSQL 15) avec RLS et RBAC
- **Google Gemini Flash 2.5 ou Deepseek ou OpenAI** pour l'évaluation conversationnelle
- **Tailwind CSS + shadcn/ui** pour l'interface
- **Mux** pour le streaming vidéo professionnel
- **Stripe** pour les paiements

## Commandes de Développement

### Configuration Environnement

```bash
# Configuration développement local
pnpm install                # Installer dépendances
pnpm dev                    # Lancer serveur développement
supabase start             # Démarrer instance Supabase locale
```

### Variables d'Environnement

Le projet utilise un **seul fichier .env** à la racine du monorepo pour toutes les variables d'environnement :

- **Fichier unique** : `.env` à la racine (chargé automatiquement par `next.config.ts`)
- **Template** : `.env.example` contient toutes les variables nécessaires
- **Sécurité** : Jamais de commit du `.env`, utiliser `.env.example` comme référence

### Qualité du Code

```bash
pnpm lint                  # Lancer ESLint
pnpm typecheck            # Vérification TypeScript
pnpm format               # Formatage Prettier
pnpm test                 # Tests unitaires
pnpm test:e2e             # Tests end-to-end
```

### Opérations Base de Données

```bash
supabase db reset         # Reset base locale
supabase db push          # Pousser migrations
supabase gen types typescript --local  # Générer types TypeScript
```

## Directives de Développement Clés

**Architecture détaillée** : @docs/STACK_TECHNIQUE.md

### Organisation du Code

- **Architecture basée sur les features** : Chaque fonctionnalité majeure est autonome
- **Server Components en priorité** : Utiliser Next.js 15 App Router avec RSC
- **APIs type-safe** : oRPC avec contrats Zod end-to-end
- **Composants atomiques** : shadcn/ui avec extensions personnalisées

# Decisions — API & Runtime

- API paradigm: oRPC uniquement. Aucune route Next.js API legacy.
- Runtime: Node.js runtime pour l'endpoint oRPC (compatibilité Supabase service role, logging, rate limit).
- Prefix d'API: dérivé via constantes/ENV, jamais en dur (fallback `/api/rpc`).
- Secrets: jamais sérialisés; service role uniquement côté serveur, scoping minimal par handler.
- Zéro mock/donnée applicative: uniquement primitives système/auth minimales.
- Validation: Zod pour toutes entrées/sorties (contrats), erreurs normalisées (401/403/422/429/500).
- Observabilité: `x-request-id` systématique, logs structurés (niveau via ENV), pas de fuite de secrets.
- Documentation: OpenAPI générée localement et versionnée dans `docs/api/v1/`.

### Patterns d'Intégration IA

- **Abstraction service** : Tous les appels IA passent par la classe `GeminiService`
- **Tracking tokens** : Chaque interaction IA est monitorée pour contrôle des coûts
- **Gestion prompts** : Prompts système stockés en base, versionnés

### Conventions de Code

#### Nommage

- Composants : PascalCase (CourseCard.tsx)
- Hooks : camelCase avec préfixe use (useProgress.ts)
- Services : camelCase avec suffixe Service (authService.ts)
- Utilitaires : camelCase (formatDate.ts)
- Types : PascalCase avec suffixe si nécessaire (User.types.ts)
- Base de données : snake_case (lesson_progress)

#### Structure des Composants

Chaque composant suit cette organisation :
ComponentName/
├── index.ts # Export public
├── ComponentName.tsx # Composant principal
├── ComponentName.types.ts # Types TypeScript
└── ComponentName.test.tsx # Tests

#### Principes de Développement

- Server Components par défaut; `use client` uniquement si nécessaire
- Pas de logique dans les composants : Extraire dans des hooks ou services
- Validation systématique : Zod pour toutes les entrées utilisateur
- Gestion d'erreur robuste : Try-catch avec messages utilisateur clairs
- Accessibilité : ARIA labels, navigation clavier, support lecteur d'écran

## Approche de Développement

### Standards de Qualité

- Code doit passer compilation TypeScript
- Composants testés manuellement avant commit
- Chemins critiques nécessitent gestion erreurs appropriée
- Considérations performance (surtout usage tokens IA)

### Sécurité et Permissions

#### RBAC V1 : Simplicité + Extensibilité

**Approche V1** : Système simple `member`/`admin` avec architecture sur-sécurisée préparée pour V2.
**Approche V2** : Extension RBAC complet avec `member_premium`, `moderator`, `instructor`.

#### Architecture Permissions V1

- **Interface extensible** : `hasPermission(user, action)` dès V1, implémentation simple
- **Rôles V1** : `member` (authentifié de base), `admin` (gestion complète système)
- **Vérification triple** : Middleware Next.js + orpc handlers + RLS Supabase
- **Préparation V2** : Structure code extensible sans refonte, migration transparente

#### RLS (Row Level Security)

Politiques RLS ultra-strictes sur toutes les tables sans exception :

- Utilisateurs : accès uniquement leurs données (user_id = auth.uid())
- Service role : webhooks Stripe et audit logging (current_setting('role') = 'service_role')  
- Admins : accès étendu contrôlé via rôle database (role = 'admin')
- Jamais de bypass sécurité : toute requête passe par RLS

#### Middleware de Sécurité

Pipeline sécurisé : security headers + CSP → rate limiting → auth extraction → role verification → route protection → onboarding validation → orpc context injection.

## 🚨 AUCUN HARDCODE ou données MOCKER

Ce CLAUDE.md fournit le contexte essentiel pour une assistance développement efficace. Les fichiers de documentation référencés contiennent les détails complets pour compréhension approfondie quand nécessaire.
