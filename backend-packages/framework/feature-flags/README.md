# academorix/feature-flags

Production-grade, multi-tenant feature-flag layer on top of Laravel Pennant. Exposes four flag kinds evaluated in a single, fixed precedence chain — **KillSwitch → Override → Rollout → PlanGate → class-default** — through one contract (`FeatureCheckerInterface`) and one facade (`Feature::active(...)`).

## Highlights

- **Attribute-driven discovery.** Add `#[AsFeatureFlag(name: 'my.flag')]` to any class; the package registers it at `package:discover`.
- **Attribute-driven gating.** Add `#[RequireFeature('my.flag')]` to any action class; the middleware wires itself.
- **Deterministic rollouts.** `sha256(flag . ':' . scope_value)` → bucket → percentage check. Raising a rollout never revokes a subject.
- **Kill switches win.** Platform-scoped shut-off rows short-circuit every other layer.
- **Scope-native.** Every mechanism (overrides / rollouts / kill switches) targets `(scope_level, scope_value)` — automatically inherits new hierarchy levels.
- **Cache-first.** Per-tenant tag flush on every write. Kill-switch TTL capped at 60s.
- **Boot-payload contribution.** `GET /api/v1/me` carries a `features` map from one batched `values()` call.
- **AI tool gating.** Compose `GatesToolVisibility` on a tool class; the persona bootstrap hides it when the flag is off.
- **Actions-only admin.** 15 single-invoke endpoints; no controllers, no route files.
- **Saloon SDK sibling** at `sdk/` for cross-service consumers.

## Sample flag classes

### Marker flag — uses the composed resolver

Every catalog row for this class is decided by the KillSwitch → Override → Rollout → PlanGate → Default chain. This is the common shape.

```php
<?php

declare(strict_types=1);

namespace App\Flags;

use Academorix\FeatureFlags\Attributes\AsFeatureFlag;
use Academorix\FeatureFlags\Enums\FlagKind;

#[AsFeatureFlag(
    name: 'billing.new_flow',
    description: 'Redesigned billing checkout flow.',
    kind: FlagKind::PlanGate,
    defaultOff: true,
)]
final class NewBillingFlowFlag
{
    // Marker class — resolver drives the decision.
}
```

### Class-based flag — custom `resolve()`

Back-compat shape with `stackra/laravel-feature-flags`. When the class exposes a public `resolve()`, discovery wires it as Pennant's class-based resolver directly.

```php
<?php

declare(strict_types=1);

namespace App\Flags;

use Academorix\FeatureFlags\Attributes\AsFeatureFlag;
use Academorix\FeatureFlags\Enums\FlagKind;

#[AsFeatureFlag(
    name: 'beta.opt_in',
    description: 'Users who opted into the beta.',
    kind: FlagKind::Override,
    defaultOff: true,
)]
final class BetaOptInFlag
{
    public function resolve(mixed $scope): bool
    {
        return $scope?->beta_opt_in === true;
    }
}
```

### Class-based flag — `before()` early-return

`before()` is Pennant's early-return callback. Returning a non-null value short-circuits every other layer.

```php
<?php

declare(strict_types=1);

namespace App\Flags;

use Academorix\FeatureFlags\Attributes\AsFeatureFlag;
use Academorix\FeatureFlags\Enums\FlagKind;

#[AsFeatureFlag(
    name: 'admin.new_dashboard',
    description: 'Redesigned admin dashboard — enabled for staff only.',
    kind: FlagKind::Override,
    defaultOff: true,
)]
final class NewDashboardFlag
{
    public function before(mixed $scope): ?bool
    {
        return $scope?->is_staff ? true : null;
    }
}
```

## Precedence chain

```
KillSwitch → Override → Rollout → PlanGate → class-default
```

Every non-package caller routes through `FeatureCheckerInterface` (or the `Feature::` facade). Direct `Laravel\Pennant\Feature::` calls outside the package are forbidden.

## HTTP status matrix

| Deciding source | HTTP | Error code                          |
|-----------------|------|-------------------------------------|
| `plan_gate`     | 402  | `feature_flags.payment_required`    |
| `override`      | 403  | `feature_flags.override_denied`     |
| `kill_switch`   | 403  | `feature_flags.disabled`            |
| `rollout`       | 403  | `feature_flags.disabled`            |
| `default`       | 403  | `feature_flags.disabled`            |

## Admin endpoints

| Method | Path                                              | Guard    | Permission                                  |
|--------|---------------------------------------------------|----------|---------------------------------------------|
| GET    | `/api/v1/feature-flags`                           | tenant   | `feature-flags.view`                        |
| GET    | `/api/v1/feature-flags/{name}`                    | tenant   | `feature-flags.view`                        |
| GET    | `/api/v1/feature-flags/kill-switches`             | platform | `platform_admin` role                       |
| POST   | `/api/v1/feature-flags/kill-switches`             | platform | `platform_admin` role                       |
| PUT    | `/api/v1/feature-flags/kill-switches/{id}`        | platform | `platform_admin` role                       |
| DELETE | `/api/v1/feature-flags/kill-switches/{id}`        | platform | `platform_admin` role                       |
| GET    | `/api/v1/feature-flags/overrides`                 | tenant   | `feature-flags.overrides.manage`            |
| POST   | `/api/v1/feature-flags/overrides`                 | tenant   | `feature-flags.overrides.manage`            |
| PUT    | `/api/v1/feature-flags/overrides/{id}`            | tenant   | `feature-flags.overrides.manage`            |
| DELETE | `/api/v1/feature-flags/overrides/{id}`            | tenant   | `feature-flags.overrides.manage`            |
| GET    | `/api/v1/feature-flags/rollouts`                  | tenant   | `feature-flags.rollouts.manage`             |
| POST   | `/api/v1/feature-flags/rollouts`                  | tenant   | `feature-flags.rollouts.manage`             |
| PUT    | `/api/v1/feature-flags/rollouts/{id}`             | tenant   | `feature-flags.rollouts.manage`             |
| DELETE | `/api/v1/feature-flags/rollouts/{id}`             | tenant   | `feature-flags.rollouts.manage`             |
| GET    | `/api/v1/me/features`                             | tenant   | `auth:sanctum`                              |

## Console commands

- `feature-flags:list` — table of every registered flag with resolved value.
- `feature-flags:enable {flag} {--tenant=} {--user=}` — allow override.
- `feature-flags:disable {flag} {--tenant=} {--user=}` — deny override or global kill switch.
- `feature-flags:purge` — flush the platform-wide cache.

## AI tool gating

Compose `GatesToolVisibility` on any AI tool class and override `requiresFeature()`:

```php
final class BetaAssistantTool extends SensitiveTool
{
    use GatesToolVisibility;

    public function requiresFeature(): ?string
    {
        return 'ai.beta_toolbelt';
    }
}
```

The persona bootstrap filters gated tools by asking the checker. Fail-closed: a checker exception hides the tool.

## Related

- `academorix/feature-flags-sdk` — Saloon client at `sdk/` for cross-service consumers.
- `academorix/scope` — hierarchy source of truth. See `docs/scope-integration.md`.
- `academorix/entitlements` — plan-gate entitlement lookup.
- ADR 0006 — attribute-first DI.
- ADR 0016 — actions-only.
- ADR 0017 — tenancy terminology (no `Workspace`, no `TenantMembership`).
