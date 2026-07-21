<?php

declare(strict_types=1);

namespace Stackra\Compliance\Contracts\Repositories;

use Stackra\Compliance\Models\LegalHold;
use Stackra\Compliance\Repositories\EloquentLegalHoldRepository;
use Stackra\Crud\Contracts\RepositoryInterface;
use DateTimeInterface;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see LegalHold}.
 *
 * @extends RepositoryInterface<LegalHold>
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Bind(EloquentLegalHoldRepository::class)]
interface LegalHoldRepositoryInterface extends RepositoryInterface
{
    /**
     * Active holds targeting one subject.
     *
     * @return Collection<int, LegalHold>
     */
    public function findActiveForSubject(string $subjectType, string $subjectId): Collection;

    /**
     * Active holds scoped to one tenant.
     *
     * @return Collection<int, LegalHold>
     */
    public function findActiveForTenant(string $tenantId): Collection;

    /**
     * Active holds targeting one model class (class-level scope).
     *
     * @return Collection<int, LegalHold>
     */
    public function findActiveForClass(string $targetClass): Collection;

    /**
     * Holds whose `expires_at` has passed. Consumed by
     * `ExpireLegalHoldsJob`.
     *
     * @return Collection<int, LegalHold>
     */
    public function findExpiredBefore(DateTimeInterface $now): Collection;
}
