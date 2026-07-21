# @stackra/config-tsup

Shared tsup config helper for the `stackra-frontend` monorepo. Every
workspace package's local `tsup.config.ts` calls
`defineBaseConfig(entries, overrides?)` from this package.

## Usage

```ts
// packages/frontend/<pkg>/tsup.config.ts
import { defineBaseConfig } from "@stackra/config-tsup";

export default defineBaseConfig({
  index: "src/index.ts",
  react: "src/react/index.ts",
});
```

The base config auto-externalises anything in `dependencies` and
`peerDependencies`; anything imported optionally at runtime (lazy `require` /
`await import`) must be listed via the `external` override.

## What `defineBaseConfig` sets

- `format: ["cjs", "esm"]`
- `dts: true` (with declaration maps)
- `sourcemap: true`, `clean: true`, `treeshake: true`, `splitting: false`
- `target: "es2022"`
- `tsconfig: "./tsconfig.json"` (per-package)
- `keepNames: true` (DI container uses `Class.name` as provider identity)
- Automatic JSX runtime for both swc and esbuild (`jsx: "automatic"`)

## Overrides

Anything the caller passes via the `overrides` argument wins. `esbuildOptions`
and `swc` are composed instead of replaced so package-level tweaks don't blow
away the JSX runtime setup.
