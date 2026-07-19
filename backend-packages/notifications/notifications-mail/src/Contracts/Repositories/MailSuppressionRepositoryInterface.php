<?php

declare(strict_types=1);

namespace Academorix\Notifications\Mail\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Notifications\Mail\Models\MailSuppression;
use Academorix\Notifications\Mail\Repositories\EloquentMailSuppressionRepository;
use DateTimeInterface;
use Illuminate\Container\Attributes\Bind;

/**
 * Repository contract for {@see MailSuppression}.
 *
 * Adds the hot-path finder the {@see \Academorix\Notifications\Mail\Channels\MailChannel}
 * consults before every send (`isSuppressed(...)`), plus the pruner
 * scan for retention. Consumers type-hint the interface, not the
 * concrete repository, so the container can swap in a stub for
 * tests.
 *
 * @extends RepositoryInterface<MailSuppression>
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[Bind(EloquentMailSuppressionRepository::class)]
interface MailSuppressionRepositoryInterface extends RepositoryInterface
{
    /**
     * Is the address suppressed for the given tenant?
     *
     * Returns `true` when a platform-wide row (`tenant_id NULL`)
     * matches OR when a tenant-scoped row (`tenant_id = $tenantId`)
     * matches. Case-insensitive on the email address.
     *
     * @param  string  $email     Recipient address (any case).
     * @param  string  $tenantId  Tenant to scope by.
     */
    public function isSuppressed(string $email, string $tenantId): bool;

    /**
     * Find an active suppression row by `(tenant_id, email)`.
     *
     * Returns the tenant-scoped row when one exists; falls back to
     * the platform-wide row (`tenant_id NULL`) when the tenant has
     * no row of its own. Returns `null` when no row matches.
     *
     * @param  string       $email     Recipient address (any case).
     * @param  string|null  $tenantId  Tenant to scope by, or NULL
     *                                 to look up ONLY platform-wide.
     */
    public function findMatching(string $email, ?string $tenantId): ?MailSuppression;

    /**
     * Soft-delete every suppression row whose `expires_at` is
     * strictly before `$cutoff`. Callers pass the pruner-derived
     * cutoff (usually `now()`) — the method does not compute
     * retention itself. Never touches `hard_bounce`, `complaint`,
     * `manual`, or `spam_trap` rows (their expires_at is NULL).
     *
     * @param  DateTimeInterface  $cutoff  Rows whose expires_at is before this are pruned.
     * @return int  Number of rows soft-deleted.
     */
    public function pruneExpired(DateTimeInterface $cutoff): int;
}
