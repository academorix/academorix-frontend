<?php

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Notifications\Sms\Contracts\Data\SmsOptOutInterface;
use Academorix\Notifications\Sms\Contracts\Repositories\SmsOptOutRepositoryInterface;
use Academorix\Notifications\Sms\Models\SmsOptOut;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see SmsOptOutRepositoryInterface}.
 *
 * ## Cache strategy
 *
 * `#[Cacheable(ttl: 300, tags: true)]` — a five-minute window is safe
 * because opt-outs are add-mostly (rarely revoked); the tenant tag flushes
 * on every write via the observer.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(SmsOptOutInterface::class)]
#[Cacheable(ttl: 300, tags: true)]
#[Filterable([
    SmsOptOutInterface::ATTR_TENANT_ID          => ['$eq', '$in', '$null'],
    SmsOptOutInterface::ATTR_PHONE_COUNTRY_CODE => ['$eq', '$in'],
    SmsOptOutInterface::ATTR_REASON             => ['$eq', '$in'],
    SmsOptOutInterface::ATTR_PROVIDER           => ['$eq', '$in'],
    SmsOptOutInterface::ATTR_IS_SYSTEM          => ['$eq'],
    SmsOptOutInterface::ATTR_OPTED_OUT_AT       => ['$gte', '$lte', '$between'],
])]
final class EloquentSmsOptOutRepository extends Repository implements SmsOptOutRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function isOptedOut(string $phone, ?string $tenantId): bool
    {
        return $this->query()
            ->where(SmsOptOutInterface::ATTR_PHONE, $phone)
            ->where(function ($query) use ($tenantId): void {
                // Platform-wide row wins regardless of tenant.
                $query->whereNull(SmsOptOutInterface::ATTR_TENANT_ID);
                if ($tenantId !== null) {
                    $query->orWhere(SmsOptOutInterface::ATTR_TENANT_ID, $tenantId);
                }
            })
            ->where(function ($query): void {
                // Consider only rows that haven't expired.
                $query
                    ->whereNull(SmsOptOutInterface::ATTR_EXPIRES_AT)
                    ->orWhere(SmsOptOutInterface::ATTR_EXPIRES_AT, '>', now());
            })
            ->exists();
    }

    /**
     * {@inheritDoc}
     */
    public function findActiveForPhone(string $phone, ?string $tenantId): ?SmsOptOut
    {
        /** @var SmsOptOut|null $row */
        $row = $this->query()
            ->where(SmsOptOutInterface::ATTR_PHONE, $phone)
            ->where(function ($query) use ($tenantId): void {
                $query->whereNull(SmsOptOutInterface::ATTR_TENANT_ID);
                if ($tenantId !== null) {
                    $query->orWhere(SmsOptOutInterface::ATTR_TENANT_ID, $tenantId);
                }
            })
            ->where(function ($query): void {
                $query
                    ->whereNull(SmsOptOutInterface::ATTR_EXPIRES_AT)
                    ->orWhere(SmsOptOutInterface::ATTR_EXPIRES_AT, '>', now());
            })
            ->orderByRaw(
                // Platform-wide row wins over tenant row of same phone.
                \sprintf(
                    'CASE WHEN %s IS NULL THEN 0 ELSE 1 END',
                    SmsOptOutInterface::ATTR_TENANT_ID,
                ),
            )
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function findByTenant(string $tenantId): Collection
    {
        /** @var Collection<int, SmsOptOut> $rows */
        $rows = $this->query()
            ->where(SmsOptOutInterface::ATTR_TENANT_ID, $tenantId)
            ->orderByDesc(SmsOptOutInterface::ATTR_CREATED_AT)
            ->get();

        return $rows;
    }
}
