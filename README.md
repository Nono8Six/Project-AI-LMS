# Project AI LMS

Prerequisites

- Node.js: LTS (>= 22)
- Package manager: pnpm (managed via Corepack)

Getting Started

- Install deps: `pnpm install`
- Run scripts: `pnpm <script>` (see `package.json`)

Conventions

- Package manager pinned via `packageManager: pnpm@10.15.1` in `package.json`.
- Lockfile `pnpm-lock.yaml` should be committed.
- No `package-lock.json` or `yarn.lock` (see `.gitignore` and `.npmrc`).

Upgrade Tooling

- Update pnpm: `corepack prepare pnpm@latest --activate`
- Update Node LTS: `winget upgrade OpenJS.NodeJS.LTS -e`
