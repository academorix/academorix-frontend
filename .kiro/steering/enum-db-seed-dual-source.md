---
inclusion: fileMatch
fileMatchPattern: "**/{Enums,Models,Seeders,Observers,Policies}/**/*.php"
---

# Enum-primary + DB seed — the dual-source catalogue pattern

Some catalogues gate code paths AND need runtime admin visibility. Business
types, statuses, plan tiers, tenant-scoped categories, notification channels —
all show the same shape:

- **Code branches on an ENUM** — type-safe, IDE-autocompleted, PHPStan-verified.
- **Admin UI reads a DB TABLE** — labels, i18n, sort order, tenant-owned
  extensions.

Neither pure DB nor pure enum is right on its own. The dual-source pattern
codified by
[ADR-0018](../../docs/adr/0018-business-types-enum-primary-db-seed.md) gets
both: the ENUM is authoritative for code branches; the TABLE is a seed-derived
mirror for the admin surface + tenant-scoped customs.

## When to reach for this pattern

Answer yes to ALL three:

1. **Does code branch on this catalogue?** (`match ($type) { ... }`,
   `if ($status === X::Active)`, permission maps keyed by case.) If nothing
   branches on it, you don't need the enum — a plain DB table is enough.
2. **Does the admin UI need to render options with labels + sort + i18n?**
   (Tenant admin picking a business type, staff picking a subscription plan.) If
   nothing renders it, a pure enum is enough — skip the table.
3. **Can tenant admins legitimately create instances outside the ones the
   product ships?** (Custom business types, tenant-defined leave reasons,
   per-tenant notification templates.) If the catalogue is fixed forever, skip
   the DB — pure enum with a first-class `Other` case is enough.

If any answer is "no", don't reach for the dual-source pattern. It carries
ceremony (enum + seeder + observer + policy + Custom bucket) that only pays off
when all three concerns coexist.

## The canonical example — `BusinessTypeEnum` + `business_types`

The ubiquitous reference. Reproduce this shape when adding a new dual-source
catalogue.

### The enum

```php
<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Business types recognised by the platform.
 *
 * Code branches on this enum for persona catalogues, default feature
 * sets, and permission maps. Tenant-defined custom business types fall
 * into the {@see self::Custom} bucket at the code level.
 *
 * ## Cases
 *
 *  * {@see self::SportsCenter}, {@see self::Club}, {@see self::Academy},
 *    {@see self::School}, {@see self::MultiSport}, {@see self::Gym},
 *    {@see self::Studio} — sports variants; unlock the coach/athlete/
 *    parent/medical role catalogue by default.
 *  * {@see self::Other} — first-class system row for "known business,
 *    outside our taxonomy". Persists in `business_types` with
 *    `is_system: true`.
 *  * {@see self::Custom} — code-level bucket for tenant-created rows.
 *    Never persisted. `BusinessTypeEnum::tryFrom($slug) ?? Custom`
 *    is the resolution pattern.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum BusinessTypeEnum: string
{
    use Enum;

    #[Label('Sports Center')]
    #[Description('Multi-discipline sports facility with coaches, athletes, and physical venues.')]
    case SportsCenter = 'sports_center';

    #[Label('Club')]
    #[Description('Membership-based sports club with recurring dues + competitive teams.')]
    case Club = 'club';

    // ... every other case here

    /**
     * Catch-all bucket for tenant-created rows. Never seeded; never
     * persisted; only reached via `tryFrom($slug) ?? Custom`.
     */
    #[Label('Custom')]
    #[Description('Tenant-defined business type outside the shipped taxonomy.')]
    case Custom = 'custom';

    /**
     * Return the default persona role slugs unlocked by this business type.
     *
     * @return list<string>
     */
    public function defaultRoles(): array
    {
        return match ($this) {
            self::SportsCenter,
            self::Club,
            self::Academy,
            self::School,
            self::MultiSport,
            self::Gym,
            self::Studio => ['coach', 'athlete', 'parent', 'medical'],

            self::Other,
            self::Custom => ['coach', 'athlete', 'parent'],
        };
    }
}
```

### The table

Migration shape — reproduce this column set for every dual-source catalogue:

| Column             | Type                        | Notes                                                                                                  |
| ------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------ |
| `id`               | `string(30)` primary        | Prefixed ULID (`bt_...`)                                                                               |
| `slug`             | `string(64)`                | For system rows: matches the enum case value. For customs: auto-generated. UNIQUE within tenant scope. |
| `label`            | JSON translatable           | Admin-facing display.                                                                                  |
| `description`      | JSON translatable, nullable | Admin-facing longer copy.                                                                              |
| `sort_order`       | `integer`                   | Admin drag-drop.                                                                                       |
| `is_system`        | `boolean`                   | `true` for enum-seeded rows; `false` for tenant customs. Immutable after seed.                         |
| `tenant_id`        | `string(30) nullable`       | `null` for system rows (shared across tenants); set for customs (owned by one tenant).                 |
| audit + timestamps | Standard                    | `created_by` / `updated_by` / `deleted_by` / `created_at` / `updated_at` / `deleted_at`.               |

Unique constraint: `(tenant_id, slug)` — a tenant can't have two customs with
the same slug, but system rows (`tenant_id = null`) can coexist with tenant
customs of the same slug.

### The seeder

One seeder per dual-source catalogue. Discovered via `#[AsSeeder]` per
[ADR-0011](../../docs/adr/0011-seeder-discovery-via-attribute.md):

```php
#[AsSeeder(priority: 20, environments: [])]
final class BusinessTypeSeeder extends Seeder
{
    public function run(): void
    {
        BusinessType::allowSystemMutation(function (): void {
            foreach (BusinessTypeEnum::cases() as $case) {
                // The Custom case is a code-level bucket only.
                if ($case === BusinessTypeEnum::Custom) {
                    continue;
                }

                BusinessType::query()->updateOrCreate(
                    [BusinessTypeInterface::ATTR_SLUG => $case->value],
                    [
                        BusinessTypeInterface::ATTR_LABEL       => $case->label(),
                        BusinessTypeInterface::ATTR_DESCRIPTION => $case->description(),
                        BusinessTypeInterface::ATTR_IS_SYSTEM   => true,
                        BusinessTypeInterface::ATTR_TENANT_ID   => null,
                    ],
                );
            }
        });
    }
}
```

Priority 20 places the seeder in the framework/tenancy tier (see
`.kiro/steering/discovery.md` and the priority ranges under
`.kiro/steering/bootstrappers.md`). `environments: []` means "run in every
environment".

### The observer — guardrail for system rows

System rows are IMMUTABLE outside the seeder. Enforce it with an observer:

```php
final class BusinessTypeObserver
{
    public function saving(BusinessType $type): void
    {
        $this->guardSystem($type, 'update');
    }

    public function deleting(BusinessType $type): void
    {
        $this->guardSystem($type, 'delete');
    }

    private function guardSystem(BusinessType $type, string $action): void
    {
        if ($type->{BusinessTypeInterface::ATTR_IS_SYSTEM} !== true) {
            return;
        }

        if (BusinessType::isSystemMutationAllowed()) {
            return;
        }

        throw new SystemRowImmutableException(\sprintf(
            'Cannot %s the system business_types row "%s" — use BusinessType::allowSystemMutation() from the seeder or tests.',
            $action,
            $type->getKey(),
        ));
    }
}
```

Wire via `#[ObservedBy(BusinessTypeObserver::class)]` on the model (never
`Model::observe()` in a provider — see `.kiro/steering/php-attributes.md`).

### The policy — authorization guardrail

Policy denies writes on system rows regardless of the actor's permissions:

```php
final class BusinessTypePolicy
{
    public function update(User $user, BusinessType $type): bool
    {
        if ($type->{BusinessTypeInterface::ATTR_IS_SYSTEM} === true) {
            return false;
        }

        return $user->can(BusinessTypePermission::Update);
    }

    public function delete(User $user, BusinessType $type): bool
    {
        if ($type->{BusinessTypeInterface::ATTR_IS_SYSTEM} === true) {
            return false;
        }

        return $user->can(BusinessTypePermission::Delete);
    }
}
```

Wire via `#[UsePolicy(BusinessTypePolicy::class)]` on the model.

### Branching on the enum

Every business-type-conditional code path uses the ENUM, never a raw string:

```php
$type = BusinessTypeEnum::tryFrom($tenant->business_type_slug)
    ?? BusinessTypeEnum::Custom;

$defaultRoles = $type->defaultRoles();
```

The `?? Custom` fallback is the CANONICAL resolution: any slug that doesn't
match a system case is a tenant custom, which the code treats as `Custom`.

## The four required components

Every dual-source catalogue ships FOUR files. Skipping any of them is a
compliance finding:

| Component                               | Where                                                    | Purpose                                                                                                                                              |
| --------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<Concept>Enum`                         | `Enums/<Concept>Enum.php`                                | Cases + `defaultXxx()` methods that drive code branches. Includes a first-class `Custom` case as the catch-all.                                      |
| `<Concept>` model + table               | `Models/<Concept>.php` + `database/migrations/<...>.php` | The admin-visible mirror; carries `is_system` + `tenant_id` columns.                                                                                 |
| `<Concept>Seeder`                       | `database/seeders/<Concept>Seeder.php`                   | Iterates enum cases and upserts system rows. `#[AsSeeder]` + wraps mutations in `<Concept>::allowSystemMutation(...)`.                               |
| `<Concept>Observer` + `<Concept>Policy` | `Observers/` + `Policies/`                               | Immutability guardrail: observer rejects `saving`/`deleting` on system rows outside the mutation-allowed scope; policy denies writes on system rows. |

## Non-negotiable rules

1. **Enum is authoritative.** Every code-level branch reads the ENUM. Raw string
   comparisons against catalogue values are a P0 compliance finding.
2. **`Custom` case is code-only, never persisted.** The seeder MUST skip the
   `Custom` case. Persisting `Custom` as a `business_types` row would collide
   with the tenant-custom bucket semantics.
3. **`Other` vs `Custom`.** Keep them semantically distinct:
   - `Other` is a first-class SYSTEM row — "known business, doesn't fit the
     taxonomy". Persisted with `is_system: true`.
   - `Custom` is a CODE bucket for tenant-created rows — never persisted. Naming
     them differently is deliberate; don't merge them into one.
4. **System rows are immutable outside the seeder.** Observer + policy together
   enforce this. Neither alone is sufficient — the observer guards seed
   integrity; the policy guards HTTP writes.
5. **Mutation-allowed scope is opt-in.**
   `<Concept>::allowSystemMutation(fn () => ...)` is the ONLY sanctioned way to
   touch system rows. Used ONLY by the seeder + tests that fixture system state.
6. **Seeded via `#[AsSeeder]`.** Every dual-source seeder carries the attribute
   per ADR-0011 so it runs deterministically on every `db:seed`. Priority in the
   10-29 range (framework/tenancy tier).
7. **Slug matches enum case value for system rows.** For every seeded row,
   `slug = BusinessTypeEnum::SportsCenter->value` — the enum backing value IS
   the slug. Discrepancy = broken code-to-DB round-trip.
8. **Resolution pattern is `tryFrom($slug) ?? EnumCase::Custom`.** Never
   `from($slug)` (throws), never bespoke matching logic. One canonical
   resolution across every consumer.
9. **SDK mirror stays in sync.** When the SDK ships a wire-visible mirror enum
   (frontend consumers render the catalogue), keep the two in sync via the
   Rector rule in `packages/sdk-generator`. Manual drift = P1 finding.

## Candidates that fit this pattern

Catalogues in this codebase that already exhibit the shape (or should adopt it
when their reference implementation is built):

- **`BusinessTypeEnum` + `business_types`** — the canonical example (ADR-0018).
- **`SubscriptionPlanEnum` + `plans`** — Paddle plan tiers gate feature
  matrices; admin needs labels + i18n; tenants can't create custom plans (fixed
  catalogue). Fits ONLY if question 3 pivots to "yes" — usually a pure enum is
  right for plans.
- **`LeaveReasonEnum` + `leave_reasons`** (Staff / HR) — Sick / Vacation /
  Personal / Bereavement in code; admin adds custom reasons per tenant; code
  branches on the enum for approval-workflow policy.
- **`NotificationChannelEnum` + `notification_channels`** — Email / SMS / Push /
  InApp / Slack in code; tenant admins enable/disable per tenant; future custom
  channels (Teams, Discord) via admin.
- **`AttendanceStatusEnum` + `attendance_statuses`** — Present / Absent / Late /
  Excused / Injured / Sick in code; admin adds custom statuses per academy; code
  branches for reporting aggregation.
- **`PaymentMethodEnum` + `payment_methods`** — Card / Wire / Cash / Check in
  code; tenant admins add custom methods per region; code branches for
  reconciliation.

For each candidate, run the three-question decision test before adopting the
pattern.

## Anti-patterns

| Anti-pattern                                                                                       | Correct                                                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Raw string comparison in a branch: `if ($tenant->business_type === 'sports_center')`               | Resolve to enum first: `$type = BusinessTypeEnum::tryFrom($slug) ?? Custom;` then `match ($type)`.                                                                                               |
| Persisting the `Custom` case as a `business_types` row                                             | The seeder skips `Custom`. It's a code-level bucket only.                                                                                                                                        |
| Merging `Other` and `Custom` into a single case                                                    | Keep them distinct — different semantics (system-known-outside-taxonomy vs tenant-defined).                                                                                                      |
| Direct writes to `business_types` from Tinker / a migration to "fix" a system row                  | Wrap in `BusinessType::allowSystemMutation(fn () => ...)` inside a seeder or test — never inline.                                                                                                |
| Observer without a policy (or vice versa)                                                          | Ship both. Observer guards ORM writes; policy guards HTTP writes. Neither alone is sufficient.                                                                                                   |
| Seeder that iterates a hardcoded array of business types                                           | Iterate `BusinessTypeEnum::cases()` — the enum is authoritative.                                                                                                                                 |
| Enum without `#[Meta]` + `#[Label]` + `#[Description]`                                             | Every dual-source catalogue enum carries all three (admin UI reads them).                                                                                                                        |
| Slug that diverges from the enum backing value for a system row                                    | `slug === $case->value` is a hard invariant.                                                                                                                                                     |
| Adding a new first-class business type without a code deploy                                       | First-class types are deploy events. Tenant customs are runtime. Adding to the enum is a first-class add.                                                                                        |
| Two seeders for one catalogue                                                                      | One seeder, one enum, one table. If you need multiple seed sources, compose them in one seeder body.                                                                                             |
| `BusinessType::factory()->create(['is_system' => true])` from a test without `allowSystemMutation` | Wrap the factory call: `BusinessType::allowSystemMutation(fn () => BusinessType::factory()->system()->create())`. Add a factory `system()` state that sets `is_system: true` inside the closure. |

## Related steering + ADRs

- [ADR-0018](../../docs/adr/0018-business-types-enum-primary-db-seed.md) — the
  decision this steering codifies.
- [ADR-0011](../../docs/adr/0011-seeder-discovery-via-attribute.md) — the
  `#[AsSeeder]` discovery contract every dual-source seeder uses.
- `.kiro/steering/php-attributes.md` §Enums (metadata shape) — the `#[Meta]` /
  `#[Label]` / `#[Description]` all-or-nothing rule.
- `.kiro/steering/models.md` — the `<Model>Interface` + `ATTR_*` constants the
  model, migration, seeder, observer, and policy all reference.
- `.kiro/steering/docblocks.md` §Per file-type standard — the enum docblock
  template with `## Cases` bullets and Magento-style tags.
- `.kiro/steering/contract-implementer-split.md` — the sibling pattern for
  concerns that split into contract + implementer packages.
