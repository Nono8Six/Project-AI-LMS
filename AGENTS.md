# Repository Guidelines

## Hard Rules (Agents)

- No hardcode: use CSS tokens (HSL vars), shared route constants, ENV for domains/URLs.
- No mock/skeleton/marketing by default. Do it only on explicit user request.
- Single `.env` at repo root loaded by `app/next.config.ts`. Validate vars; client can only read `NEXT_PUBLIC_*`.
- RSC first; `use client` only when required (Radix/shadcn).
- Security: strict CSP in prod; image/remote patterns from ENV; dangerous SVG disabled.
- Quality: TS strict + ESLint clean; Tailwind via tokens; shadcn/ui idiomatic.
- DX: Node ≥ 22; use `check:node`, `dev:clean`, `port:free`.

## Project Structure & Module Organization

- Root: `package.json`, `.env`, `.env.example`, `README.md`, `CLAUDE.md`.
- Docs: `docs/` (see `STACK_TECHNIQUE.md` for intended Next.js layout and architecture).
- Database/Infra: `supabase/` (CLI config, migrations via Supabase).
- Tooling: `.vscode/` for workspace settings.
- App code: will live under `app/src/...` as outlined in `docs/STACK_TECHNIQUE.md` (e.g., `app/src/app`, `components`, `features`).

## Build, Test, and Development Commands

- Install deps: `pnpm install` (Node >= 22; Corepack manages pnpm).
- Lint: `pnpm lint` (fix: `pnpm lint:fix`).
- Format: `pnpm format` (check only: `pnpm format:check`).
- Type-check: `pnpm typecheck`.
- Unit tests: `pnpm test` (watch: `pnpm test:watch`, coverage: `pnpm test:coverage`).
- Supabase login: `pnpm supabase:login`.
- Link project: `pnpm supabase:link` (uses `SUPABASE_PROJECT_REF` and `SUPABASE_DATABASE_PASSWORD`).
- Start/stop local DB: `pnpm supabase:start` / `pnpm supabase:stop`.
- New migration: `pnpm db:migration:new`.
- Apply schema: `pnpm db:push`.

## Coding Style & Naming Conventions

- Indentation: 2 spaces; TypeScript preferred where applicable.
- Components: `PascalCase` (e.g., `CourseCard.tsx`).
- Utilities/functions: `camelCase` (e.g., `formatDate.ts`).
- Constants/env: `UPPER_SNAKE_CASE`.
- Routes/folders: `kebab-case`.
- Lint/format: ESLint + Prettier configurés (`eslint.config.mjs`, `.prettierrc.json`).

## Testing Guidelines

- Unit tests via Vitest (see `vitest.config.ts`).
- Naming: `*.test.ts(x)` under `tests/` or colocated with source.
- Coverage reports: `pnpm test:coverage` outputs to `coverage/`.
- For React UI later: add RTL (`@testing-library/react`) and Playwright for e2e.

## Commit & Pull Request Guidelines

- History is minimal; adopt Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- PRs include: clear description, linked backlog item from `docs/BACKLOG.md`, screenshots/GIFs for UI, and note any DB migrations.
- Keep changes focused; update docs when behavior or commands change.

## Security & Configuration Tips

- Never commit secrets. Copy `.env.example` to `.env` and fill locally.
- Use `pnpm` (pinned via `packageManager`); do not add `package-lock.json` or `yarn.lock`.
- When using Supabase locally, ensure Docker is running; stop services with `pnpm supabase:stop`.

# Decisions — API & Runtime

- API paradigm: oRPC uniquement. Aucune route Next.js API legacy.
- Runtime: Node.js runtime pour l’endpoint oRPC (compatibilité Supabase service role, logging, rate limit).
- Prefix d’API: dérivé via constantes/ENV, jamais en dur (fallback `/api/rpc`).
- Secrets: jamais sérialisés; service role uniquement côté serveur, scoping minimal par handler.
- Zéro mock/donnée applicative: uniquement primitives système/auth minimales.
- Validation: Zod pour toutes entrées/sorties (contrats), erreurs normalisées (401/403/422/429/500).
- Observabilité: `x-request-id` systématique, logs structurés (niveau via ENV), pas de fuite de secrets.
- Documentation: OpenAPI générée localement et versionnée dans `docs/api/v1/`.
