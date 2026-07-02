# Academorix Frontend — Agent Guide

Standalone repo (`academorix/academorix-frontend`). Web only. Deploys to Vercel
(https://academorix.vercel.app). The Laravel backend is a separate repo.

## Stack & layout

- **pnpm workspaces + Turborepo.** Node >= 22, pnpm >= 10.
- `apps/web` — Vite 8 + React 19 SPA (the deployable).
- `packages/ui` (`@academorix/ui`) — re-exports `@heroui/react` (OSS) +
  `@heroui-pro/react` (Pro) + heroicons + shared composites. JIT (no build).
- `packages/eslint-config`, `packages/typescript-config` — shared configs.

## Dependencies

- **All versions live in the pnpm catalog** (`pnpm-workspace.yaml`). Reference
  them with `"catalog:"` in package.json — never hardcode versions in a package.
- `@heroui-pro/react` is licensed: its postinstall needs `HEROUI_AUTH_TOKEN`
  (set on Vercel + in Doppler). It's in `onlyBuiltDependencies`.

## HeroUI (v3)

- Import from `@academorix/ui/react`, not `@heroui/react` directly.
- Use `onPress` (not `onClick`); Tailwind v4; `Separator` (not `Divider`);
  compound components via dot notation (`Card.Header`, `Sheet.Content`).
- Icons: `@academorix/ui/icons/{outline,solid,mini,micro}`.

## Environment

- Vite env lives in `apps/web/environments/` (`envDir`). Vars are
  `VITE_`-prefixed and **public** (shipped to the browser). Validated via zod in
  `src/config/env.ts`.
- **Doppler is the source of truth** (project `academorix-frontend`, configs
  `dev`/`stg`/`prd`). Pull with `pnpm secrets:pull`; run with
  `doppler run -- ...`.
- `environments/.env` is gitignored; `.env.example` + `.env.production` are
  committed.

## Commands

- `pnpm dev` · `pnpm build` · `pnpm test` · `pnpm e2e` (Playwright)
- `pnpm quality` (format:check + lint + typecheck + knip) — must pass before
  commit.
- `pnpm quality:fix` to auto-fix. Prettier printWidth is 100.
- `pnpm size` — bundle-size budget (size-limit).

## Conventions

- Every change must pass `pnpm quality` and `pnpm test`.
- Commits follow Conventional Commits (commitlint via Husky). Husky runs
  lint-staged on pre-commit.
- Deploy: `git push` auto-deploys via Vercel. Manual:
  `vercel build --prod && vercel deploy --prebuilt --prod`.
