<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Tenancy\Models\Tenant;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a Tenant's own settings are updated via
 * `PATCH /api/current-tenant`.
 *
 * Distinct from `settings::SettingsChangeEvent` — that fires per-field
 * whereas this fires per-tenant with the aggregate list of changed
 * columns.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'tenancy.tenant.settings_updated')]
final readonly class TenantSettingsUpdated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  Tenant             $tenant         The tenant whose settings changed.
     * @param  array<int,string>  $changedFields  Column names that were modified.
     */
    public function __construct(
        public Tenant $tenant,
        public array $changedFields,
    ) {
    }
}
