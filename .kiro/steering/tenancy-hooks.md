---
inclusion: fileMatch
fileMatchPattern: "**/TenancyHooks/**/*.php"
---

# Tenancy hooks — per-tenant lifecycle callbacks

Different concept from `.kiro/steering/bootstrappers.md`. Read that first if you
haven't; the naming split matters.

## Location

TenancyHooks live in `<module>/src/TenancyHooks/` — one folder, one primitive.
Never in `Bootstrappers/`, never in `Concerns/`, never in `Support/`. The
registry that catalogues them (`TenancyHookRegistry`) lives in
`packages/framework/service-provider/src/Registry/`.

See `.kiro/steering/folder-conventions.md` for the locked per-folder ownership
table.

| Concept                      | Fires when              | Cached?               | Owns                              |
| ---------------------------- | ----------------------- | --------------------- | --------------------------------- |
| **Bootstrapper**             | Once at framework boot  | Yes (framework cache) | Discovery + registry hydration    |
| **Tenancy Hook** (this file) | Every tenant init / end | No (per-tenant state) | Session-specific setup / teardown |

Tenancy hooks exist because SOME per-request state is unavoidable in
multi-tenant systems — spatie/permission's team context, tenant-scoped cache
prefixes, sentry tenant tags, DB search paths. None of that fits a bootstrapper
(which runs once at app boot, before any tenant is resolved). It ALL fits a
lightweight per-init callback that hangs off tenancy resolution.

## The contract

Every tenancy hook implements
`Academorix\ServiceProvider\Contracts\TenancyHookInterface`:

```php
interface TenancyHookInterface
{
    public function onTenantInitialized(TenantHookContext $ctx): void;
    public function onTenantEnded(TenantHookContext $ctx): void;
}
```

`TenantHookContext` is a readonly VO with:

- `container: Container` — the request-scoped container
- `tenant: ?object` — the current tenant (nullable to support central-context
  invocations)
- `metadata: array<string, mixed>` — free-form bag for cross-hook communication
  (rarely used)

## Registration — attribute-driven

Every hook carries `#[AsTenancyHook(priority: N)]` and is auto-discovered at
boot by the `TenancyHookBootstrapper` (which populates the `TenancyHookRegistry`
— a `#[Singleton]` map of class-strings).

```php
#[AsTenancyHook(priority: 200)]
final class PermissionsTenantHook implements TenancyHookInterface
{
    public function __construct(
        private readonly PermissionRegistrar $registrar,
    ) {}

    public function onTenantInitialized(TenantHookContext $ctx): void
    {
        $tenant = $ctx->tenant;
        if ($tenant === null) {
            return;
        }
        $this->registrar->setPermissionsTeamId($tenant->getKey());
        $this->registrar->forgetCachedPermissions();
    }

    public function onTenantEnded(TenantHookContext $ctx): void
    {
        $this->registrar->setPermissionsTeamId(null);
        $this->registrar->forgetCachedPermissions();
    }
}
```

Priority = lower runs first. Recommended ranges:

| Range          | Purpose                                                        |
| -------------- | -------------------------------------------------------------- |
| **0 .. 99**    | Framework-level (cache prefix, DB search path, log context)    |
| **100 .. 199** | Ancillary infra (sentry tenant tag, correlation-id enrichment) |
| **200 .. 299** | Permission / auth wiring (spatie team, guard mapping)          |
| **300+**       | Domain-specific (feature-flag cache warming per tenant, ...)   |

## Dispatch

Tenancy initialization code (middleware, artisan tenant-scope commands, queue
tenant-aware job handlers) resolves the shared `TenancyHookDispatcher` and calls
`fireInit()` / `fireEnd()`:

```php
final class BindTenantContext
{
    public function __construct(
        private readonly TenancyHookDispatcher $dispatcher,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $tenant = $this->resolveTenant($request);

        $this->dispatcher->fireInit($tenant);
        try {
            return $next($request);
        } finally {
            $this->dispatcher->fireEnd($tenant);
        }
    }
}
```

The dispatcher iterates the registry sorted by priority. Errors in one hook are
logged + swallowed — one broken hook must not halt tenancy resolution. Symmetric
`fireEnd()` runs in reverse priority order so teardown mirrors setup.

## Non-negotiable rules

1. **Symmetric.** Every hook implements both `onTenantInitialized` AND
   `onTenantEnded`. If `onTenantInitialized` sets X, `onTenantEnded` must clear
   X. Never leave state behind under Octane — the next request's tenant would
   inherit the previous request's config.
2. **Idempotent.** Both callbacks can fire twice on the same tenant (e.g. nested
   `Tenancy::runInTenant`). Both must be no-ops on the second call.
3. **No throws.** Log + swallow. Broken hooks are ops issues, not request
   failures.
4. **No `populate()`.** Hooks aren't bootstrappers. If you need discovery, use a
   bootstrapper. Hooks apply already-discovered state to the tenant scope.
5. **Constructor-inject dependencies via container attributes.** No facades.
   Hooks run per-request but instances are shared; the container manages request
   lifecycle for their deps.
6. **`null` tenant is valid.** Central-context requests pass a `null` tenant;
   hooks must gracefully accept that (usually by returning early).

## Octane symmetry

Under Octane the container survives across requests. A `TenancyHookInterface`
implementation MUST clean up whatever it mutated in `onTenantInitialized` — the
very next request may resolve a different tenant, and any leftover state from
the previous tenant is a security bug.

The pattern:

- On init: snapshot the singleton state you're about to mutate, set the new
  state
- On end: restore the snapshot (never assume a default — the previous state
  might have BEEN a mid-request nested tenant)

## Anti-patterns

- ❌ Extending `Stancl\Tenancy\Contracts\TenancyBootstrapper` directly — that
  couples us to a specific tenancy backend. Route through
  `TenancyHookInterface`; if we later need the stancl contract, a shim adapter
  wraps our hook.
- ❌ Reading discovery state (personas, tools, retention policies) inside a
  hook. If you need "per-tenant subset of personas", filter at the point of use,
  not at hook time.
- ❌ Firing the dispatcher from application code that's not actually
  initializing tenancy. Only wrap true tenant-scope transitions.
- ❌ Doing expensive work inside a hook. Hooks are per-request; they must be
  <1ms. Cache warming belongs in a bootstrapper.
- ❌ Making one hook depend on another hook's side effects. Express ordering via
  `priority()` but design each hook to be independent (idempotent,
  side-effect-free apart from the one state slot it owns).

## Related steering

- `.kiro/steering/bootstrappers.md` — the sibling concept for app-boot
  discovery + cache
- `.kiro/steering/octane-first-di.md` — Octane request lifecycle
  - `#[Scoped]` vs `#[Singleton]` on services touched by hooks
- `.kiro/steering/scope.md` — how the scope package's context integrates with
  tenancy resolution
