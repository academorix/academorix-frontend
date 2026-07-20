# @stackra/vite

Neutral Vite-config orchestrator for the Stackra workspace.

Ships a typed `defineConfig(...)` helper and a `{ enabled, factory, options }`
plugin-map envelope. Consumers bring their own plugin factories from the
third-party packages they depend on — this package is deliberately **not** a
plugin registry with built-ins.

## Installation

```bash
pnpm add -D @stackra/vite vite
```

`vite` is a required peer dependency.

## The plugin-map envelope

Instead of assembling a `plugins: [...]` array, describe each plugin as an entry
in a map:

```typescript
import type { IPluginMap } from "@stackra/vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

const plugins: IPluginMap = {
  react: {
    enabled: true,
    factory: react,
    options: { tsDecorators: true },
  },
  tsconfigPaths: {
    enabled: true,
    factory: tsconfigPaths,
    options: {},
  },
  tailwindcss: {
    enabled: false,
    factory: tailwindcss,
    options: {},
  },
};
```

Each entry is a triple:

| Field     | Purpose                                                                             |
| --------- | ----------------------------------------------------------------------------------- |
| `enabled` | Toggle the plugin on / off. `false` skips the factory entirely — zero cost.         |
| `factory` | Function returning the plugin instance (`Plugin`) or an array (`Plugin[]`).         |
| `options` | Options bag passed to `factory(...)`. Required (even if `{}`) so `TOptions` infers. |

The factory is invoked **only** when `enabled === true`, so a disabled entry
never installs its plugin or evaluates its options.

## `defineConfig(...)`

```typescript
// vite.config.ts
import { defineConfig } from "@stackra/vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: {
    react: {
      enabled: true,
      factory: react,
      options: { tsDecorators: true },
    },
    tsconfigPaths: {
      enabled: true,
      factory: tsconfigPaths,
      options: {},
    },
  },
  server: { port: 3000 },
  build: { target: "es2022" },
});
```

Returns a Vite config factory `(env: ConfigEnv) => Promise<UserConfig>` — the
same shape Vite's own `defineConfig(...)` accepts. Internally it:

1. Resolves the plugin map into a `Plugin[]` array (each enabled entry's factory
   is invoked with its options; disabled entries are skipped).
2. Deep-merges the workspace defaults under your overrides — you always win on
   conflict.
3. Attaches the resolved plugin array to the merged config.

## Exports

| Export                  | Kind      | Purpose                                                               |
| ----------------------- | --------- | --------------------------------------------------------------------- |
| `defineConfig`          | function  | Primary entry point — builds the Vite config factory.                 |
| `resolvePlugins`        | function  | Standalone plugin-map resolver. Useful for custom orchestration.      |
| `deepMerge`             | function  | Recursive merge helper. Public for consumers that need it directly.   |
| `DEFAULT_VITE_CONFIG`   | constant  | The minimal Vite defaults applied under every consumer's overrides.   |
| `IPluginEntry`          | interface | Envelope shape for a single plugin (`{ enabled, factory, options }`). |
| `IPluginMap`            | interface | Record of plugin-name → entry.                                        |
| `IViteConfigOptions`    | interface | Argument type for `defineConfig(...)`.                                |
| `ViteConfigError`       | class     | Base error class for the package.                                     |
| `PluginResolutionError` | class     | Thrown when a plugin factory throws during map resolution.            |

## Defaults

`DEFAULT_VITE_CONFIG` is deliberately minimal — the two fields it sets are:

- `envPrefix: 'VITE_'` — Vite's own default, re-declared here so the merge is
  deterministic regardless of upstream changes.
- `esbuild.tsconfigRaw.compilerOptions.experimentalDecorators: true` — matches
  the workspace's `tsconfig.base.json` so legacy TS decorators parse in a stock
  esbuild pipeline.

Note: `emitDecoratorMetadata` is intentionally **not** set — esbuild's
`TsconfigRaw` type does not declare it (esbuild has never implemented
decorator-metadata emission). Consumers that rely on `design:paramtypes` for DI
should layer an SWC-based plugin into the map, e.g. `@vitejs/plugin-react-swc`
with `tsDecorators: true`, or `unplugin-swc` directly.

Consumer overrides deep-merge on top; every default is override-able.

## Error handling

If a plugin factory throws during resolution, the exception is wrapped in
`PluginResolutionError`. The original exception is preserved on the `cause`
field, and the offending plugin's map key is embedded in the message.

```typescript
try {
  await defineConfig({ plugins })({ mode: "development", command: "serve" });
} catch (err) {
  if (err instanceof PluginResolutionError) {
    console.error(err.code); // 'VITE_CONFIG_PLUGIN_RESOLUTION'
    console.error(err.message); // Plugin "react" factory threw: ...
    console.error(err.cause); // the original exception
  }
}
```

Every error the package raises extends `ViteConfigError`, so a single
`instanceof ViteConfigError` catches the whole family.

## Consumer template

The package ships `config/vite.config.ts` — copy it into your app's
`src/config/` directory and customise. `pnpm dlx` copy scripts can pick it up
because the `config/` folder is part of the published package (`files` field in
`package.json`).

## Scope of v0

This is a lean v0 focused on the envelope + orchestrator. It intentionally ships
**no** built-in plugin factories. Bring your own plugins from
`@vitejs/plugin-react-swc`, `vite-tsconfig-paths`, `@tailwindcss/vite`, etc.,
and wire them through the map.

### Not in v0 (future work)

The following were in the internal `.ref/vite-config` prototype and are
candidates for a v0.2 lane:

- Built-in plugin factories for env-loading, type generation, decorator
  discovery, ngrok tunnels, terminal QR codes, and static-site generation.
- Mode-aware default construction (`createDefaults(mode)`).
- `@stackra/support` migration (`Str` / `Arr` / `Env` in helpers) — v0 uses
  native JS in helpers because `@stackra/support` is not a v0 peer.

## Development

From inside `packages/vite/`:

```bash
pnpm typecheck   # tsc --noEmit
pnpm build       # tsup dual ESM/CJS + .d.ts
pnpm test        # vitest run
```
