<?php

declare(strict_types=1);

namespace Stackra\Audit\Concerns;

use OwenIt\Auditing\Auditable as OwenItAuditable;

/**
 * Compose on any Eloquent model that should record audit events.
 *
 * Thin alias over owen-it/laravel-auditing's `Auditable` trait — the
 * vendor implementation already covers:
 *
 *   - Registering the `created` / `updated` / `deleted` / `restored`
 *     lifecycle listeners that persist the audit row.
 *   - Diff computation (`old_values` vs `new_values`) based on the
 *     model's `$auditExclude` / `$auditInclude` lists.
 *   - Actor + request-context resolution via owen-it's resolver
 *     interfaces (user, url, ip_address, user_agent).
 *
 * ## Why our own trait?
 *
 * Composing consumers write `use HasAudit;` — a single Stackra name
 * — instead of `use OwenItAuditable;`. This buys us the option to
 * layer additional defaults on top (KMS opt-in, default excluded
 * paths, tenant-context assertions) without touching every model that
 * previously composed the vendor trait directly.
 *
 * ## Related
 *
 *   - {@see \Stackra\Audit\Attributes\Auditable} — pair with this
 *     trait via `#[Auditable(encryptFields: [...])]`. The framework's
 *     generic
 *     {@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 *     scans the attribute at boot and pushes each hit through
 *     {@see \Stackra\Audit\Contracts\Services\AuditRegistryInterface::register()};
 *     the trait is what makes the model emit audit rows.
 *   - `OwenIt\Auditing\Contracts\Auditable` — the vendor contract every
 *     composer must ALSO implement. Add
 *     `implements AuditableContract, ...` to the model's class line.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
trait HasAudit
{
    use OwenItAuditable;
}
