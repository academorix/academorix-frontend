# @academorix/config-tsconfig

Shared TypeScript configuration presets. Every `tsconfig.json` in the monorepo
extends one of these files so upgrading TS rules happens in exactly one place.

## Presets

| File                 | Extends              | For                                                                                          |
| -------------------- | -------------------- | -------------------------------------------------------------------------------------------- |
| `base.json`          | —                    | Every TS project. Strictness dial, decorators on, source maps, no unused.                    |
| `react-library.json` | `base.json`          | Library packages that ship React components (`packages/ui`, etc.)                            |
| `vite.json`          | `react-library.json` | Vite React apps (`apps/dashboard`, `apps/landing-page`) — `noEmit`, DOM types, JSX react-jsx |
| `vite-node.json`     | `base.json`          | Vite/Vitest/Playwright config files themselves (node context)                                |

## Usage

```jsonc
// apps/dashboard/tsconfig.app.json
{
  "extends": "@academorix/config-tsconfig/vite",
  "compilerOptions": {
    "outDir": "dist",
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] },
  },
}
```

Each app / package MAY add project-local overrides in `compilerOptions`, but
should not disable a rule set by the preset without a written justification
(leave a comment referencing the ADR).
