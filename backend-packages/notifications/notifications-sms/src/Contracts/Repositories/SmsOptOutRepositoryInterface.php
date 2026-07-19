<?php

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Notifications\Sms\Models\SmsOptOut;
use Academorix\Notifications\Sms\Repositories\EloquentSmsOptOutRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see SmsOptOut}.
 *
 * Adds the dispatch-hot-path finders on top of the base CRUD surface.
 * Consumers depend on this contract, not on the concrete repository.
 *
 * @extends RepositoryInterface<SmsOptOut>
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[Bind(EloquentSmsOptOutRepository::class)]
interface SmsOptOutRepositoryInterface extends RepositoryInterface
{
    /**
     * Whether the given phone is opted out for the tenant. Considers both
     * tenant-scoped rows AND platform-wide rows (`tenant_id = NULL`).
     */
    public function isOptedOut(string $phone, ?string $tenantId): bool;

    /**
     * Find the active opt-out row for a phone in a tenant scope, if any.
     */
    public function findActiveForPhone(string $phone, ?string $tenantId): ?SmsOptOut;

    /**
     * Every opt-out row for a tenant.
     *
     * @return Collection<int, SmsOptOut>
     */
    public function findByTenant(string $tenantId): Collection;
}
