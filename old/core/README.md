# @academorix/core

Zero-dependency foundation for the Academorix workspace. Every other
`@academorix/*` package builds on top of this one.

## Install

Already available in the workspace:

```jsonc
// package.json
{
  "dependencies": {
    "@academorix/core": "workspace:*",
  },
}
```

## Public API

| Subpath                   | Exports                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------ |
| `@academorix/core/env`    | `env<T>(key, default, schema?)`, `createEnvReader(read)`                             |
| `@academorix/core/config` | `defineConfig<T>`, `defineFrozenConfig<T>`, `defineNamedConfig<T>`                   |
| `@academorix/core/errors` | `HttpError`, `isHttpError`                                                           |
| `@academorix/core/brand`  | `Brand<T, Name>`, `Unbrand<T>`, `LocaleBrand`                                        |
| `@academorix/core/utils`  | `assertNever`, `assertDefined`, `trimTrailingSlash`, `ensureLeadingSlash`, `joinUrl` |

Prefer subpath imports over the root barrel for optimal tree-shaking.

## Design principles

- **No React, no DOM, no Node built-ins.** Runs on every bundler + every runtime
  the workspace touches.
- **One primitive per file, cluster related exports.** Types, constants, and
  small helpers that share a concern stay together.
- **Every export has a TSDoc block.** Non-obvious behaviour is documented in
  prose, not just types.

## Examples

### Reading env vars

```ts
import { env } from "@academorix/core/env";
import { z } from "zod";

const port = env("VITE_PORT", 3000);
const tier = env(
  "VITE_APP_ENV",
  "local" as const,
  z.enum(["local", "staging", "production"]),
);
```

### Typed config passthrough

```ts
import { defineConfig } from "@academorix/core/config";

interface FeatureFlags {
  readonly dashboardV2: boolean;
}

export const flags = defineConfig<FeatureFlags>({
  dashboardV2: true,
});
```

### Nominal IDs

```ts
import type { Brand } from "@academorix/core/brand";

export type TenantId = Brand<string, "TenantId">;
export type UserId = Brand<string, "UserId">;
```

### HTTP errors

```ts
import { HttpError, isHttpError } from "@academorix/core/errors";

try {
  await api.post("/users", body);
} catch (caught) {
  if (isHttpError(caught) && caught.statusCode === 422) {
    setFieldErrors(caught.errors ?? {});
  }
}
```
