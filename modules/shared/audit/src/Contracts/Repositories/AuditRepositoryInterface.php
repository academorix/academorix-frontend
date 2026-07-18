<?php

declare(strict_types=1);

namespace Academorix\Audit\Contracts\Repositories;

use Academorix\Audit\Models\Audit;
use Academorix\Audit\Repositories\EloquentAuditRepository;
use Academorix\Crud\Contracts\RepositoryInterface;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see Audit}.
 *
 * Adds four domain finders on top of the base CRUD surface:
 *
 *   - {@see findByAuditable()} — every audit row referencing one
 *     auditable target. Consumed by the "history" tab on any
 *     `Auditable` aggregate's detail screen.
 *   - {@see findByUser()}      — every audit row where the actor was
 *     a specific `(user_type, user_id)` pair. Consumed by user-
 *     account activity views.
 *   - {@see findForDsar()}     — every audit row referencing a
 *     subject across a date window. Consumed by
 *     {@see \Academorix\Audit\Jobs\ExportAuditForDsarJob}.
 *   - {@see findChainBreaks()} — every audit row whose stored
 *     `chain_hash` disagrees with the recomputed value at the last
 *     verification run. Consumed by the platform-admin surface.
 *
 * @extends RepositoryInterface<Audit>
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[Bind(EloquentAuditRepository::class)]
interface AuditRepositoryInterface extends RepositoryInterface
{
    /**
     * Every audit row referencing one auditable target.
     *
     * Ordered by `created_at` DESC — the most recent event first.
     *
     * @param  string  $type  Polymorphic type of the target (owen-it
     *   morph-maps this to the aggregate FQCN).
     * @param  string  $id    Auditable target id (usually a prefixed
     *   ULID matching the target aggregate's ID_PREFIX).
     * @return Collection<int, Audit>
     */
    public function findByAuditable(string $type, string $id): Collection;

    /**
     * Every audit row where the actor was a specific user.
     *
     * @param  string  $userType  Polymorphic type of the actor (User,
     *   PlatformUser, ServiceAccount).
     * @param  string  $userId    Actor id.
     * @return Collection<int, Audit>
     */
    public function findByUser(string $userType, string $userId): Collection;

    /**
     * Every audit row referencing a subject across a date window.
     *
     * The subject can appear in three positions per row:
     *   - `user_id` — actor identifier.
     *   - `auditable_id` — target identifier.
     *   - Inside `old_values` / `new_values` JSON — indirect reference
     *     (e.g., a permission grant whose subject is the affected
     *     user id).
     *
     * @param  string             $userId  The subject id.
     * @param  \DateTimeInterface $from    Window start (inclusive).
     * @param  \DateTimeInterface $to      Window end (inclusive).
     * @return Collection<int, Audit>
     */
    public function findForDsar(string $userId, \DateTimeInterface $from, \DateTimeInterface $to): Collection;

    /**
     * Every audit row whose stored `chain_hash` disagreed with the
     * recomputed value at the last verification run.
     *
     * The verifier marks each verified row's `chain_verified_at`
     * timestamp; broken rows keep it NULL AFTER verification has
     * touched them, so this query relies on the chain-verifier
     * emitting {@see \Academorix\Audit\Events\AuditChainBroken} rather
     * than a persisted state column. Returns the rows currently
     * pending re-verification.
     *
     * @return Collection<int, Audit>
     */
    public function findChainBreaks(): Collection;
}
