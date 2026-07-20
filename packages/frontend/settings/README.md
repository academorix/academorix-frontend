# @stackra/settings

Unified settings framework — registry-based schema, multi-driver persistence,
real-time broadcast, HeroUI-driven admin UI.

## What it does

- One `SettingsRegistry` accepts BOTH local DTO classes (`@Setting()` /
  `@Field()` / `@Group()` / `@Section()`) AND JSON schemas fetched from a REST
  endpoint. Downstream code stays source-agnostic.
- `SettingsService` gives a sync `get(dto)` API backed by async hydration —
  React `useState` initializers work; async stores fill in later and notify
  subscribers.
- Writes are debounced (300 ms default) and dispatched through a named store —
  `memory`, `storage` (wraps `@stackra/storage`), or `api` (wraps
  `@stackra/http` with `retry` from `@stackra/support`).
- Optional realtime broadcast subscription via `@stackra/realtime` merges
  `settings.changed` events into the local cache — the admin UI updates
  automatically when another client (or the backend) writes.
- React hooks in `./react` return typed result objects; the schema- driven
  `<SettingsForm>` renders every field through a HeroUI compound component per
  `ControlType`.

## Installation

```bash
pnpm add @stackra/settings
```

## Peers

- `@stackra/container` — DI
- `@stackra/contracts` — tokens / interfaces
- `@stackra/support` — `Str` / `Uri` / `retry` / `sleep` / `createSeedLoader`
- `@stackra/storage` — the persistence layer settings composes over
- `@stackra/http` — the transport the `api` store composes over
- `@stackra/realtime` (optional) — realtime broadcast subscription
- `@stackra/logger` (optional) — fail-soft logging
- `@stackra/ui` (optional) — HeroUI compound components for `/react`

## License

MIT © Stackra L.L.C
