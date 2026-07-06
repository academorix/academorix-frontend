# @academorix/feature-flags

Typed feature-flag primitives for the Academorix workspace: static-by- default
declaration, env-var overrides at boot, runtime overrides via React context.

Depends on `@academorix/core` and React 19.

## Public API

| Subpath                             | Exports                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `@academorix/feature-flags/config`  | `defineFlags<T extends Record<string, boolean>>(flags)`                                                 |
| `@academorix/feature-flags/env`     | `envFlag(key, default)` — boolean env reader                                                            |
| `@academorix/feature-flags/context` | `createFeatureFlagsContext<TFlag>()` → `{ FeatureFlagsProvider, useFeature, useAllFeatures, defaults }` |

Root barrel re-exports everything for one-line imports.

## Three layers, one type

1. **Static defaults** — declared in the app's `features.config.ts` via
   `defineFlags({ ... })`. Frozen at module init.
2. **Env override** — `envFlag(key, default)` reads a build-time env var and
   folds the result into the static default. Vite inlines the substitution, so
   shipping a new build atomically updates the flag.
3. **Runtime override** — the `<FeatureFlagsProvider overrides={...}>` prop
   shadow-merges per-user / per-cohort flags on top.

## Usage

### 1. Declare the flags

```ts
// apps/dashboard/src/config/features.config.ts
import { defineFlags, envFlag } from "@academorix/feature-flags";

export const featureFlags = defineFlags({
  dashboardV2: true,
  commandPalette: envFlag("VITE_FLAG_COMMAND_PALETTE", true),
  experimentalCharts: envFlag("VITE_FLAG_EXPERIMENTAL_CHARTS", false),
});

export type FeatureFlag = keyof typeof featureFlags;
```

### 2. Instantiate the provider bundle

```ts
// apps/dashboard/src/lib/feature-flags/context.ts
import { createFeatureFlagsContext } from "@academorix/feature-flags/context";
import { featureFlags, type FeatureFlag } from "@/config/features.config";

export const { FeatureFlagsProvider, useFeature, useAllFeatures } =
  createFeatureFlagsContext<FeatureFlag>(featureFlags);
```

### 3. Mount once

```tsx
// apps/dashboard/src/providers.tsx
<FeatureFlagsProvider overrides={identityFlags}>
  <App />
</FeatureFlagsProvider>
```

### 4. Consume anywhere

```tsx
import { useFeature } from "@/lib/feature-flags";

function Header() {
  const showPalette = useFeature("commandPalette");
  return showPalette ? <CommandPalette /> : null;
}
```
