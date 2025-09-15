# Structure TypeScript - Phase 3 Ready

Cette documentation décrit l'architecture TypeScript optimisée pour la Phase 3 (Route Groups et Navigation) du projet LMS IA.

## Architecture des Types

### 📁 Structure des Fichiers

```
src/shared/types/
├── navigation.types.ts      # Types navigation et routes
├── auth.types.ts           # Types authentification et RBAC
├── content.types.ts        # Types contenu pédagogique
├── ai.types.ts             # Types IA et évaluation
├── progress.types.ts       # Types progrès et analytics
├── api.types.ts            # Types API et Supabase
├── route-handlers.types.ts # Types Route Handlers Next.js
├── common.types.ts         # Types utilitaires
├── index.ts               # Export central
└── README.md              # Documentation
```

### 🎯 Points Clés pour Phase 3

#### Navigation Typée

- **UserRole**: `'visitor' | 'member' | 'moderator' | 'admin'`
- **RouteGroup**: `'public' | 'member' | 'admin'`
- **NavigationItem**: Structure complète des menus
- **ROUTE_PATHS**: Constantes typées pour toutes les routes

#### Route Handlers Next.js 15

- **RouteHandler<TParams, TResponse>**: Type générique pour les handlers
- **AuthenticatedRouteHandler**: Handlers avec authentification
- **RoleProtectedRouteHandler**: Handlers avec contrôle de rôle
- Types spécifiques par namespace (PublicRoutes, MemberRoutes, AdminRoutes)

#### Path Mapping Optimisé

Le `tsconfig.json` inclut tous les alias nécessaires :

```json
{
  "@/*": ["src/*"],
  "@/components/*": ["src/components/*"],
  "@/features/*": ["src/features/*"],
  "@/core/*": ["src/core/*"],
  "@/shared/*": ["src/shared/*"],
  "@/types/*": ["src/shared/types/*"],
  "@/utils/*": ["src/shared/utils/*"],
  "@/lib/*": ["src/shared/lib/*"],
  "@/constants/*": ["src/shared/constants/*"]
}
```

## Utilisation Recommandée

### Import des Types

```typescript
// Import spécifique recommandé
import type { UserRole, NavigationItem } from '@/shared/types/navigation.types';
import type { Course, Lesson } from '@/shared/types/content.types';

// Import global (pour les types communs)
import type { ID, LoadingState } from '@/types';
```

### Route Handlers

```typescript
import type { RouteHandler, CourseParams } from '@/types/route-handlers.types';

export const GET: RouteHandler<CourseParams, Course> = async (request, { params }) => {
  const { courseId } = await params;
  // Implementation
};
```

### Composants avec Types

```typescript
import type { NavigationItem, UserRole } from '@/types/navigation.types';

interface NavigationProps {
  items: readonly NavigationItem[];
  userRole: UserRole;
}

export function Navigation({ items, userRole }: NavigationProps) {
  // Implementation
}
```

## Configuration TypeScript

### Flags Stricts Activés

- `noUncheckedIndexedAccess`: Sécurité des accès aux index
- `exactOptionalPropertyTypes`: Typage exact des propriétés optionnelles
- `strict`: Mode strict complet
- Types d'imports/exports cohérents via ESLint

### Validation ESLint

Configuration ESLint optimisée pour :

- Imports organisés par groupes
- Conventions de nommage strictes
- Type safety renforcée
- Accessibilité (a11y) intégrée

## Patterns Recommandés

### 1. Types en lecture seule

```typescript
export interface Course {
  readonly id: string;
  readonly title: string;
  readonly modules: readonly Module[];
}
```

### 2. Union Types Discriminées

```typescript
export type LessonContent = VideoContent | TextContent | QuizContent | ExerciseContent;
```

### 3. Type Guards

```typescript
export const isVideoContent = (content: LessonContent): content is VideoContent => {
  return content.type === 'video';
};
```

### 4. Utilitaires de Types

```typescript
export type ExtractRouteParams<T extends string> =
  T extends `${infer _Start}[${infer Param}]${infer Rest}`
    ? { [K in Param]: string } & ExtractRouteParams<Rest>
    : {};
```

### 5. Constants avec Types

```typescript
export const ROUTE_PATHS = {
  HOME: '/' as const,
  DASHBOARD: '/dashboard' as const,
  // ...
} as const;

export type RoutePath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS];
```

## Intégrations Clés

### Supabase Database Types

Types générés automatiquement pour toutes les tables et vues :

```typescript
export interface Database {
  public: {
    Tables: {
      /* ... */
    };
    Views: {
      /* ... */
    };
    Functions: {
      /* ... */
    };
  };
}
```

### Next.js App Router

Support complet des Route Handlers avec paramètres typés :

```typescript
export type RouteParams<T = Record<string, string>> = {
  readonly params: Promise<T>;
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
};
```

### AI Models & Tokens

Types stricts pour tous les modèles IA supportés :

```typescript
export type AIModel =
  | 'gemini-2.5-flash'
  | 'gemini-2.0-flash'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'deepseek-chat';
```

## Performance & Scalabilité

- **Compilation incrémentale** activée
- **Path mapping** pour éviter les imports relatifs
- **Tree shaking** optimisé avec imports spécifiques
- **Type-only imports** enforced via ESLint
- **Bundle size** optimal avec types utilitaires conditionnels

## Commandes de Développement

```bash
# Vérification TypeScript
pnpm typecheck

# Linting avec règles TypeScript strictes
pnpm lint

# Fix automatique des imports
pnpm lint:fix

# Tests de types (à implémenter)
pnpm test:types
```

## Prochaines Étapes Phase 3

Cette structure TypeScript est maintenant prête pour :

1. ✅ Implémentation des Route Groups Next.js
2. ✅ Navigation avec contrôle de rôles typé
3. ✅ API Routes avec validation stricte
4. ✅ Middleware d'authentification typé
5. ✅ Layouts imbriqués avec props typées

La base TypeScript est solide et extensible pour toutes les features de la Phase 3 et au-delà.
