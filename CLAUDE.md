# CLAUDE.md

Ce fichier fournit des directives à Claude Code (claude.ai/code) pour travailler efficacement sur ce repository.

## Aperçu du Projet

**LMS IA** - Plateforme d'apprentissage adaptatif alimentée par l'IA, spécialisée dans l'apprentissage personnalisé via l'évaluation conversationnelle. La plateforme utilise l'IA pour créer des parcours d'apprentissage personnalisés et évaluer la compréhension des étudiants par dialogue naturel plutôt que par QCM traditionnels.

### Innovation Clé

Voir en détails : @docs/LE_PROJET.md

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
# Configuration développement local (à implémenter)
pnpm install                # Installer dépendances
pnpm dev                    # Lancer serveur développement
supabase start             # Démarrer instance Supabase locale
```

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
- **APIs type-safe** : Toutes les routes API utilisent la validation Zod
- **Composants atomiques** : shadcn/ui avec extensions personnalisées

### Patterns d'Intégration IA
- **Abstraction service** : Tous les appels IA passent par la classe `GeminiService`
- **Tracking tokens** : Chaque interaction IA est monitorée pour contrôle des coûts
- **Gestion prompts** : Prompts système stockés en base, versionnés

### Logique Métier Clé

**Référence complète** : @docs/LE_PROJET.md

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
├── index.ts                    # Export public
├── ComponentName.tsx            # Composant principal
├── ComponentName.types.ts       # Types TypeScript
└── ComponentName.test.tsx       # Tests

#### Principes de Développement

- Server Components par défaut : Utiliser 'use client' uniquement si nécessaire
- Pas de logique dans les composants : Extraire dans des hooks ou services
- Validation systématique : Zod pour toutes les entrées utilisateur
- Gestion d'erreur robuste : Try-catch avec messages utilisateur clairs
- Accessibilité : ARIA labels, navigation clavier, support lecteur d'écran

## Documentation Importante

### Lecture Obligatoire Avant Codage
- `@docs/LE_PROJET.md` - Vision complète projet et exigences (PRD)
- `@docs/STACK_TECHNIQUE.md` - Architecture technique et patterns
- `@docs/BACKLOG.md` - Plan développement détaillé (10 phases, 75 sessions)

## Approche de Développement

### Standards de Qualité
- Code doit passer compilation TypeScript
- Composants testés manuellement avant commit
- Chemins critiques nécessitent gestion erreurs appropriée
- Considérations performance (surtout usage tokens IA)

### Sécurité et Permissions

#### RBAC (Role-Based Access Control)
Rôles définis : visiteur, membre, modérateur, admin
Chaque rôle a des permissions spécifiques vérifiées à trois niveaux :

- Middleware Next.js (protection routes)
- Layouts avec vérification de rôle
- RLS Supabase (sécurité base de données)

#### RLS (Row Level Security)
Politiques actives sur toutes les tables :

- Les utilisateurs voient uniquement leurs données
- Les admins ont accès étendu via service role key
- Jamais d'accès direct à la base sans vérification

Ce CLAUDE.md fournit le contexte essentiel pour une assistance développement efficace. Les fichiers de documentation référencés contiennent les détails complets pour compréhension approfondie quand nécessaire.