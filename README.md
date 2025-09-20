# Project AI LMS

## Prerequisites

- Node.js: LTS (>= 22)
- Package manager: pnpm (managed via Corepack)
- Docker (for Supabase local development)

## Getting Started

### 1. Installation

```bash
pnpm install                    # Install dependencies
```

### 2. Environment Setup

```bash
cp .env.example .env           # Copy environment template
# Edit .env with your local values
```

### 3. Database Setup (Local Development)

```bash
supabase start                 # Start local Supabase
supabase db reset             # Apply all migrations
pnpm gen:types                # Generate TypeScript types
```

### 4. Development

```bash
pnpm dev                      # Start Next.js development server
pnpm dev:clean                # Start with clean port check
```

> TODO : implémentation des pages Next.js reportée tant que la base Auth n’est pas validée.

## Available Scripts

### Development
- `pnpm dev` - Start development server
- `pnpm dev:clean` - Start with clean port check

### Quality Assurance
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - TypeScript type checking
- `pnpm format` - Format with Prettier
- `pnpm test` - Run tests

### Supabase Integration Tests
1. Ensure Supabase local is running: `supabase start` (and migrations appliquées via `supabase db reset`).
2. Export les variables requises dans le shell de test :
   ```bash
   export NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   export NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY_LOCAL"     # injecté via votre gestionnaire de secrets
   export SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY_LOCAL" # injecté via votre gestionnaire de secrets
   ```
3. Lancer les scénarios :
   ```bash
   pnpm vitest run tests/integration/auth.sessions.test.ts tests/integration/rateLimit.backoff.test.ts
   ```
4. Pour la validation d’environnement :
   ```bash
   pnpm vitest run tests/env/server-env.test.ts
   ```

### Build & Production
- `pnpm build` - Build for production
- `pnpm start` - Start production server

### Database
- `pnpm gen:types` - Generate TypeScript types from Supabase
- `supabase db reset` - Reset database with migrations
- `supabase db push` - Push migrations to remote

### Utilities
- `pnpm check:node` - Verify Node.js version
- `pnpm port:free` - Free up ports

## Project Structure

- `app/` - Next.js 15 application
- `supabase/` - Database migrations and configuration
- `docs/` - Project documentation
- `scripts/` - Build and utility scripts
- `tests/` - Test files

## Conventions

- Package manager pinned via `packageManager: pnpm@10.15.1` in `package.json`
- Lockfile `pnpm-lock.yaml` should be committed
- No `package-lock.json` or `yarn.lock` (see `.gitignore` and `.npmrc`)
- TypeScript strict mode enabled
- ESLint + Prettier for code quality

## Upgrade Tooling

- Update pnpm: `corepack prepare pnpm@latest --activate`
- Update Node LTS: `winget upgrade OpenJS.NodeJS.LTS -e`


