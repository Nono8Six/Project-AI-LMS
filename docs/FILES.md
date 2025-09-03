# Guide des Fichiers du Dépôt

Ce document décrit le rôle de chaque fichier et dossier présent dans ce dépôt. Il est mis à jour à chaque ajout/modification structurante.

## Racine (fichiers)

- `README.md` : démarrage rapide, prérequis et conventions pnpm/Node.
- `AGENTS.md` : règles pour contributeurs (structure, commandes, style, tests, PRs). Fichier pour CODEX
- `CLAUDE.md` : directives destinées aux assistants IA (contexte, stack, commandes). Pour CLAUDE CODE
- `package.json` : métadonnées du projet, scripts (`lint`, `format`, `test`, `supabase:*`), engines.
- `.npmrc` : préférences npm/pnpm (désactive `package-lock`, peers auto, silence audit/fund).
- `.gitignore` : ignore `node_modules`, builds, `coverage`, fichiers `.env`, artefacts Supabase.
- `.editorconfig` : règles d’édition (UTF-8, LF, 2 espaces, fin de ligne, trim).
- `eslint.config.mjs` : configuration ESLint (flat config v9+) TypeScript + Prettier, avec `ignores` intégrés.
- `.prettierrc.json` : formatage (largeur 100, 2 espaces, guillemets simples, virgules finales).
- `.prettierignore` : exclusions pour Prettier.
- `tsconfig.json` : options TypeScript (ES2022, strict, noEmit, JSX react-jsx, types Vitest).
- `vitest.config.ts` : configuration Vitest (env node, couverture V8, patterns tests).
- `.env` : variables d’environnement locales (non commitées).
- `.env.example` : modèle documenté des variables d’environnement.

## Dossiers

- `docs/` : documentation projet.
  - `docs/STACK_TECHNIQUE.md` : architecture cible (Next.js, Supabase, IA, etc.).
  - `docs/LE_PROJET.md` : vision produit et exigences.
  - `docs/BACKLOG.md` : plan de développement et priorités.
  - `docs/FILES.md` : ce guide des fichiers.
- `supabase/` : configuration et ressources Supabase (local + cloud).
  - `supabase/config.toml` : configuration CLI/instances locales.
- `.vscode/` : préférences d’espace de travail (facilitent une configuration homogène éditeur).
  - `.vscode/settings.json` : active Deno pour `supabase/functions`, formatteur TypeScript Deno, options instables.
  - `.vscode/extensions.json` : recommandations d’extensions (Deno).
- `node_modules/` : dépendances installées (généré, non versionné).
- `tests/` : tests unitaires Vitest.
  - `tests/smoke.test.ts` : test de fumée minimal pour valider l’outillage.

## Commandes utiles

- Lint: `pnpm lint` / `pnpm lint:fix`.
- Format: `pnpm format` / `pnpm format:check`.
- Types: `pnpm typecheck`.
- Tests: `pnpm test` / `pnpm test:watch` / `pnpm test:coverage`.
- Supabase: `pnpm supabase:start|stop|login|link`, migrations `pnpm db:migration:new`, `pnpm db:push`.

## Notes

- Ne jamais commiter de secrets: dupliquer `.env.example` en `.env` localement.
- Le dépôt est outillé pour TypeScript, ESLint, Prettier et Vitest; ajoutez les règles au besoin.
