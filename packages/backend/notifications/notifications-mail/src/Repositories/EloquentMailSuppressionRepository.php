<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Notifications\Mail\Contracts\Data\MailSuppressionInterface;
use Stackra\Notifications\Mail\Contracts\Repositories\MailSuppressionRepositoryInterface;
use Stackra\Notifications\Mail\Enums\MailSuppressionReason;
use Stackra\Notifications\Mail\Models\MailSuppression;
use DateTimeInterface;

/**
 * Eloquent implementation of {@see MailSuppressionRepositoryInterface}.
 *
 * ## What this class owns
 *
 * Hot-path finders the {@see \Stackra\Notifications\Mail\Channels\MailChannel}
 * + the retention pruner rely on:
 *
 *   - {@see isSuppressed()} — pre-send block-list check. Called
 *     exactly once per send attempt.
 *   - {@see findMatching()} — admin view + observer lookup.
 *   - {@see pruneExpired()} — retention soft-delete for
 *     soft-bounce rows.
 *
 * ## Cache strategy
 *
 * `#[Cacheable(ttl: 300, tags: true)]` — the send path is
 * latency-sensitive. Model observers invalidate on create / update
 * / delete so a freshly-added suppression takes effect on the very
 * next send.
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(MailSuppressionInterface::class)]
#[Cacheable(ttl: 300, tags: true)]
#[Filterable([
    MailSuppressionInterface::ATTR_TENANT_ID    => ['$eq', '$in'],
    MailSuppressionInterface::ATTR_EMAIL        => ['$eq', '$in'],
    MailSuppressionInterface::ATTR_EMAIL_DOMAIN => ['$eq', '$in'],
    MailSuppressionInterface::ATTR_REASON       => ['$eq', '$in'],
    MailSuppressionInterface::ATTR_PROVIDER     => ['$eq', '$in'],
    MailSuppressionInterface::ATTR_IS_SYSTEM    => ['$eq'],
    MailSuppressionInterface::ATTR_CREATED_AT   => ['$gte', '$lte', '$between'],
    MailSuppressionInterface::ATTR_EXPIRES_AT   => ['$gte', '$lte', '$between'],
])]
final class EloquentMailSuppressionRepository extends Repository implements MailSuppressionRepositoryInterface
{
    /**
     * {@inheritDoc}
     *
     * Reads through the global `BelongsToTenantOptional` scope —
     * platform-wide rows (`tenant_id NULL`) are visible to every
     * tenant read, tenant-scoped rows are filtered to their owner.
     * The additional `$tenantId` filter here narrows to the caller's
     * tenant when the global scope isn't active (e.g. running under
     * a console command without a resolved tenant context).
     */
    public function isSuppressed(string $email, string $tenantId): bool
    {
        $normalised = \strtolower(\trim($email));

        return $this->query()
            ->where(MailSuppressionInterface::ATTR_EMAIL, $normalised)
            ->where(function ($query) use ($tenantId): void {
                $query
                    ->whereNull(MailSuppressionInterface::ATTR_TENANT_ID)
                    ->orWhere(MailSuppressionInterface::ATTR_TENANT_ID, $tenantId);
            })
            ->exists();
    }

    /**
     * {@inheritDoc}
     */
    public function findMatching(string $email, ?string $tenantId): ?MailSuppression
    {
        $normalised = \strtolower(\trim($email));

        /** @var MailSuppression|null $row */
        $row = $this->query()
            ->where(MailSuppressionInterface::ATTR_EMAIL, $normalised)
            ->when(
                $tenantId !== null,
                fn ($query) => $query->where(function ($inner) use ($tenantId): void {
                    $inner
                        ->whereNull(MailSuppressionInterface::ATTR_TENANT_ID)
                        ->orWhere(MailSuppressionInterface::ATTR_TENANT_ID, $tenantId);
                }),
                fn ($query) => $query->whereNull(MailSuppressionInterface::ATTR_TENANT_ID),
            )
            // Prefer tenant-scoped over platform-wide when both
            // rows exist for the address.
            ->orderByRaw(\sprintf(
                'CASE WHEN %s IS NULL THEN 1 ELSE 0 END',
                MailSuppressionInterface::ATTR_TENANT_ID,
            ))
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     *
     * Only prunes soft-bounce entries — every other reason is
     * either permanent or governed by a different retention rule
     * (complaint at P5Y, spam-trap forever, manual by admin).
     */
    public function pruneExpired(DateTimeInterface $cutoff): int
    {
        return $this->query()
            ->where(MailSuppressionInterface::ATTR_REASON, MailSuppressionReason::SoftBounce->value)
            ->whereNotNull(MailSuppressionInterface::ATTR_EXPIRES_AT)
            ->where(MailSuppressionInterface::ATTR_EXPIRES_AT, '<', $cutoff)
            ->delete();
    }
}
