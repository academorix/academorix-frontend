# @academorix/config-eslint

Shared ESLint flat config presets. Every `eslint.config.mjs` in the monorepo
starts from one of these:

| Preset     | Extends | For                                                      |
| ---------- | ------- | -------------------------------------------------------- |
| `base`     | —       | Pure TS/JS libraries. No React, no browser globals.      |
| `react`    | `base`  | Libraries that ship React components.                    |
| `vite-app` | `react` | Vite React apps (`apps/dashboard`, `apps/landing-page`). |

## Usage

```js
// apps/dashboard/eslint.config.mjs
import viteApp from "@academorix/config-eslint/vite-app";

export default [
  ...viteApp,
  // app-specific overrides here
];
```

## Design

- Prettier is loaded last via `eslint-config-prettier` — Prettier owns
  formatting; ESLint owns semantic rules.
- Type-aware rules use `parserOptions.projectService: true` for automatic
  tsconfig discovery.
- Import ordering enforced globally via `eslint-plugin-import`.
- `eslint-plugin-unicorn` provides opinionated code-quality rules minus
  abbreviation checking (too noisy).
