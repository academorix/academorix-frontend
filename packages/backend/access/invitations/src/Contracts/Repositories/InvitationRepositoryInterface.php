<?php

declare(strict_types=1);

namespace Stackra\Invitations\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Invitations\Models\Invitation;
use Stackra\Invitations\Repositories\EloquentInvitationRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see Invitation}.
 *
 * Adds domain finders on top of the base CRUD surface — token
 * lookup (accept flow), pending-invitation lookup (unique rule),
 * expiry sweep (retention job), and target-scoped listing
 * (consumer modules via `HasInvitations`). Consumers depend on
 * this contract, not on the concrete
 * `EloquentInvitationRepository`.
 *
 * @extends RepositoryInterface<Invitation>
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
#[Bind(EloquentInvitationRepository::class)]
interface InvitationRepositoryInterface extends RepositoryInterface
{
    /**
     * Resolve the invitation by SHA-256 token hash.
     *
     * The caller hashes the raw token before calling — this method
     * never receives the raw token itself.
     */
    public function findByTokenHash(string $tokenHash): ?Invitation;

    /**
     * Resolve a pending invitation matching the tuple used by the
     * `unique_pending_invitation` rule.
     */
    public function findPending(
        string $tenantId,
        string $targetType,
        string $targetId,
        string $email,
    ): ?Invitation;

    /**
     * Every non-terminal invitation for a polymorphic target.
     *
     * @return Collection<int, Invitation>
     */
    public function pendingForTarget(string $targetType, string $targetId): Collection;

    /**
     * Every non-terminal invitation whose `expires_at < $cutoff`.
     *
     * @return Collection<int, Invitation>
     */
    public function findExpiring(\DateTimeInterface $cutoff, int $limit = 500): Collection;

    /**
     * Count invitations sent by a user in the given time window.
     * Backs the per-inviter throttle counters.
     */
    public function countByInviterSince(
        string $inviterType,
        string $inviterId,
        \DateTimeInterface $since,
    ): int;
}
