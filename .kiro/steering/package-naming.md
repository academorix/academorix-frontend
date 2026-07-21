# Package naming — the workspace convention

The workspace hosts TWO products under one Git repo:

- **Stackra** — the framework/platform. Backend (Laravel), frontend (Vite +
  React + TypeScript), native (React Native + Uniwind), config presets, CLI, and
  JSON blueprints for the RBAC/auth/audit substrates. Every package under
  `packages/*`, `tools/cli/`, and `blueprints/*` is Stackra.
- **Stackra** — the first product built ON Stackra. Sports academy / gym /
  school / clinic domain. Every package under
  `apps/stackra/src/{modules,sdks,blueprints}/**` is Stackra.

This split is a policy decision: Stackra is what we ship internally as the
framework Kiro + future products build on; Stackra is what we ship to the
customer. Renaming a package from Stackra to Stackra (or the reverse) is a
boundary-crossing operation that requires an ADR.

## Rule 1 — Vendor scope is the boundary

| Vendor prefix           | Ecosystem           | Owner      | Home                                                                                 |
| ----------------------- | ------------------- | ---------- | ------------------------------------------------------------------------------------ |
| `stackra/*`             | Composer (PHP)      | Stackra    | `packages/backend/*`, `packages/sdk/*`, `tools/cli/`, `blueprints/*` (metadata only) |
| `@stackra/*`            | npm (TS)            | Stackra    | `packages/frontend/*`, `packages/config/*`                                           |
| `stackra/*`          | Composer (PHP)      | Stackra | `apps/stackra/src/**` (aggregate/app-scope only)                                  |
| `@stackra/*`         | npm (TS)            | Stackra | `apps/stackra/**/package.json`                                                    |
| `stackra-<domain>/*` | Composer sub-vendor | Stackra | `apps/stackra/src/{modules,sdks}/<domain>/*`                                      |

Every composer package MUST have `name:` in exactly one of the above buckets.
Every npm package MUST have `name:` in exactly one of the `@stackra/*` or
`@stackra/*` buckets. Anything else fails the audit.

## Rule 2 — No framework prefix in the package name

Reject prefixes like `laravel-*`, `ts-*`, `js-*`, `php-*`, `react-*` inside the
package name. The **`@` character is the ecosystem discriminator**:

- npm sees `@stackra/container` → TypeScript / React runtime.
- Composer sees `stackra/container` → PHP runtime.

The vendor scope alone tells the resolver which ecosystem. Adding `laravel-*` on
top is redundant. Precedent: `illuminate/support` (not
`illuminate/laravel-support`), `@nestjs/common` (not `@nestjs/ts-common`),
`laravel/horizon` (not `laravel/php-horizon`).

**Exception**: when a package is a THIRD-PARTY adapter (wraps a third-party lib
for use inside Stackra), the third-party's OWN name survives inside the package
name — because that's the discovery handle developers already know.
`stackra/horizon` (adapter around `laravel/horizon`), `stackra/debugbar`
(adapter around `barryvdh/laravel-debugbar`), `stackra/sentry` (adapter around
`sentry/sentry-laravel`). We drop the `laravel-` prefix from OUR side; we keep
the third-party's own name so the mapping is legible.

## Rule 3 — One slash, dashed sub-vendors for grouping

Composer and npm both allow exactly ONE slash in a package name. Sub-domain
grouping uses dashed vendor names:

- ✓ `stackra/caching`
- ✓ `stackra-sports/athlete-sdk`
- ✗ `stackra/framework/caching` — invalid (two slashes)
- ✗ `stackra/sports/athlete-sdk` — invalid (two slashes)

**When to use dashed sub-vendors:**

| Bucket                                                  | Pattern                          | Rationale                                                                                               |
| ------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Stackra framework packages                              | **flat** — `stackra/<name>`      | The framework is one coherent product. Flat mirrors `illuminate/*`.                                     |
| Stackra observability triad (activity/audit/monitoring) | `stackra-observability/<name>`   | Grandfathered — three cross-cutting packages that ship together.                                        |
| Stackra shared substrate                                | `stackra-shared/<name>`          | Grandfathered — packages every service consumes.                                                        |
| Stackra domain modules                               | `stackra-<domain>/<name>`     | Domain grouping is the primary organizational axis for the product (sports, finance, growth, platform). |
| Stackra domain SDKs                                  | `stackra-<domain>/<name>-sdk` | Sibling to the domain module, suffixed `-sdk`.                                                          |
| Stackra top-level                                    | `stackra/<name>`              | For app-scope aggregators — the composer.json at the app root, if any.                                  |

**Threshold for a new sub-vendor**: 3+ related packages that ship together AND
share a bounded-context vocabulary. Below that threshold, stay flat —
`stackra/telemetry-horizon` reads worse than `stackra/horizon` and doesn't
justify a new sub-vendor.

## Rule 4 — Package name is kebab-case

- ✓ `stackra/caching`, `stackra/service-provider`,
  `stackra-sports/athlete-sdk`
- ✗ `stackra/Caching`, `stackra/serviceProvider`, `stackra/service_provider`

Matches Laravel's own convention (`illuminate/support`, `illuminate/database`,
`laravel/horizon`) and npm ecosystem defaults.

## Rule 5 — PHP namespace derives mechanically from the vendor

Given a composer name, the PHP namespace is deterministic:

- `stackra/caching` → `Stackra\Caching\`
- `stackra/service-provider` → `Stackra\ServiceProvider\`
- `stackra-observability/activity` → `Stackra\Observability\Activity\`
- `stackra-shared/foundation` → `Stackra\Shared\Foundation\`
- `stackra-sports/athlete-sdk` → `Stackra\Sports\AthleteSdk\`
- `stackra-finance/chargeback` → `Stackra\Finance\Chargeback\`
- `stackra/access` (if it existed) → `Stackra\Access\`

Rule: split the vendor on `-` and split the package name on `-`. Each segment
becomes a `StudlyCase` namespace part. Dashed vendors become nested namespaces.
This composer.json snippet is the ONLY place the mapping lives:

```json
{
  "name": "stackra-observability/activity",
  "autoload": {
    "psr-4": {
      "Stackra\\Observability\\Activity\\": "src/"
    }
  }
}
```

## Rule 6 — Physical folder path does NOT dictate the package name

The composer/npm `name:` is the shipped identifier. The folder path is for human
navigation. They RESEMBLE each other but do not have to match
character-for-character.

- Folder: `packages/backend/framework/caching/`
- Composer name: `stackra/caching`
- PHP namespace: `Stackra\Caching\`

The `framework/` folder segment is human organisation — Composer never sees it.
When we move a package between folders (e.g. reorganising
`packages/backend/framework/*` into `packages/backend/`) the composer name stays
unchanged.

## Rule 7 — `dev/deploy` alignment

Every `@dev` dep in a composer.json MUST correspond to a package that exists in
the workspace with the matching name. The `wire-composer-path-repos` script
(soon: `stackra/cli`'s `composer:sync` command) walks every `composer.json` and
writes a `repositories` entry for each resolvable `@dev` dep. Unresolved names
are reported for human review — the workspace should have zero of these
post-rename.

## Rule 8 — The vendor rename is a boundary crossing

A package moves from `stackra/*` to `stackra/*` (or the reverse) ONLY through
an ADR. Signals a domain re-classification (framework concern turned product
concern, or the other direction). Every such rename touches:

- The composer.json `name:` field.
- The PSR-4 namespace map + every PHP file's `namespace` declaration.
- Every downstream `require`, `require-dev`, `suggest`, `replace`, `provide`
  reference across every composer.json in the workspace.
- Every catalog.json `peer_deps` array.
- Every prose reference in `.md` / steering / ADR / spec files.

Use the `stackra/cli` `composer:rename` command (also planned) to automate the
mechanical parts.

## Migration checklist for a new package

Copy-paste checklist for authoring a new package:

- [ ] Decide the vendor: `stackra/*`, `@stackra/*`, `stackra/*`,
      `@stackra/*`, or a `-<domain>/*` sub-vendor.
- [ ] Name in kebab-case.
- [ ] No framework prefix (see Rule 2 for the third-party-adapter exception).
- [ ] PHP namespace derives from the vendor per Rule 5.
- [ ] Physical folder can be anywhere; naming survives moves (Rule 6).
- [ ] `catalog.json` `id:` (if the workspace uses it) matches the composer name.
- [ ] Docs README doesn't invent a name; uses the canonical composer name in
      every code fence.

## Enforcement

- **Audit script**: `scripts/audit-composer-naming.py` (Python) — soon to be
  `stackra/cli` `composer:audit`. Runs in CI. Fails if any package name violates
  Rule 1-6.
- **Wire script**: `scripts/wire-composer-path-repos.py` — soon to be
  `stackra/cli` `composer:sync`. Rewires path repositories after any rename or
  folder move. Idempotent + `--check` mode for CI.
- **Rename script**: `scripts/rename-composer-packages.py` — bulk rename with
  automatic downstream reference updates. Used for any Rule-8 migration.

## Anti-patterns to reject in review

| Anti-pattern                                                  | Correct                                    |
| ------------------------------------------------------------- | ------------------------------------------ |
| `stackra/laravel-caching`                                     | `stackra/caching`                          |
| `@stackra/ts-container`                                       | `@stackra/container`                       |
| `stackra/sports-athlete`                                   | `stackra-sports/athlete`                |
| `stackra/frameworkCaching`                                    | `stackra/framework-caching` (kebab)        |
| `stackra/framework/caching` (2 slashes)                       | `stackra/framework-caching`                |
| `stackra/Caching` (PascalCase)                                | `stackra/caching`                          |
| A composer name that doesn't match its PSR-4 root             | Fix per Rule 5                             |
| A `@dev` dep whose target name doesn't exist in the workspace | Fix the typo OR author the missing package |

## Grandfather list

At the time of this steering (2026-07-21), the following packages predate the
steering and are locked as-is until the vendor migration lands:

- `stackra-observability/{activity, audit, monitoring}` — the observability
  triad. Will migrate to `stackra-observability/*` under Rule 1.
- `stackra-shared/foundation` — the shared substrate. Will migrate to
  `stackra-shared/foundation`.
- `stackra/{debugbar, horizon, nightwatch, omniterm, sentry, serializer}` —
  Laravel adapters. Being renamed to `stackra/{name}` (this steering commit)
  and then migrated to `stackra/{name}` (subsequent vendor commit).

All other `stackra/*` framework packages migrate to `stackra/*` in the
vendor-migration commit.

## Related

- ADR-0027 (planned) — the vendor split ADR that formalises the Stackra +
  Stackra boundary.
- `.kiro/steering/hierarchy.md` — the platform tree that the vendor split aligns
  with.
- `.kiro/steering/module-lifecycle.md` — how packages boot, per vendor.
