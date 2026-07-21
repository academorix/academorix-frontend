<?php

declare(strict_types=1);

namespace Stackra\Invitations\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Invitations\Contracts\Data\InvitationInterface;
use Stackra\Invitations\Contracts\Repositories\InvitationRepositoryInterface;
use Stackra\Invitations\Enums\InvitationStatus;
use Stackra\Invitations\Models\Invitation;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see InvitationRepositoryInterface}.
 *
 * ## Cache strategy
 *
 * `#[Cacheable(ttl: 60, tags: true)]` — a short TTL because a
 * pending invitation can flip to `accepted` at any moment and the
 * accept flow must see the transition immediately. The observer
 * flushes tenant tags on writes so subsequent reads see the new
 * state.
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(InvitationInterface::class)]
#[Cacheable(ttl: 60, tags: true)]
#[Filterable([
    InvitationInterface::ATTR_TENANT_ID      => ['$eq', '$in'],
    InvitationInterface::ATTR_APPLICATION_ID => ['$eq', '$in'],
    InvitationInterface::ATTR_STATE          => ['$eq', '$in'],
    InvitationInterface::ATTR_TARGET_TYPE    => ['$eq', '$in'],
    InvitationInterface::ATTR_TARGET_ID      => ['$eq'],
    InvitationInterface::ATTR_EMAIL          => ['$eq', '$contains'],
    InvitationInterface::ATTR_TOKEN_PREFIX   => ['$eq'],
])]
final class EloquentInvitationRepository extends Repository implements InvitationRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByTokenHash(string $tokenHash): ?Invitation
    {
        /** @var Invitation|null $row */
        $row = $this->query()
            ->where(InvitationInterface::ATTR_TOKEN_HASH, $tokenHash)
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function findPending(
        string $tenantId,
        string $targetType,
        string $targetId,
        string $email,
    ): ?Invitation {
        /** @var Invitation|null $row */
        $row = $this->query()
            ->where(InvitationInterface::ATTR_TENANT_ID, $tenantId)
            ->where(InvitationInterface::ATTR_TARGET_TYPE, $targetType)
            ->where(InvitationInterface::ATTR_TARGET_ID, $targetId)
            ->where(InvitationInterface::ATTR_EMAIL, \strtolower($email))
            ->whereIn(InvitationInterface::ATTR_STATE, $this->nonTerminalStates())
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function pendingForTarget(string $targetType, string $targetId): Collection
    {
        /** @var Collection<int, Invitation> $rows */
        $rows = $this->query()
            ->where(InvitationInterface::ATTR_TARGET_TYPE, $targetType)
            ->where(InvitationInterface::ATTR_TARGET_ID, $targetId)
            ->whereIn(InvitationInterface::ATTR_STATE, $this->nonTerminalStates())
            ->orderByDesc(InvitationInterface::ATTR_CREATED_AT)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findExpiring(\DateTimeInterface $cutoff, int $limit = 500): Collection
    {
        /** @var Collection<int, Invitation> $rows */
        $rows = $this->query()
            ->whereIn(InvitationInterface::ATTR_STATE, $this->nonTerminalStates())
            ->where(InvitationInterface::ATTR_EXPIRES_AT, '<', $cutoff)
            ->orderBy(InvitationInterface::ATTR_EXPIRES_AT)
            ->limit($limit)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function countByInviterSince(
        string $inviterType,
        string $inviterId,
        \DateTimeInterface $since,
    ): int {
        return $this->query()
            ->where(InvitationInterface::ATTR_INVITER_TYPE, $inviterType)
            ->where(InvitationInterface::ATTR_INVITER_ID, $inviterId)
            ->where(InvitationInterface::ATTR_CREATED_AT, '>=', $since)
            ->count();
    }

    /**
     * Values used across every "still-open" query — pending +
     * delivered + opened + clicked + bounced. Terminal states are
     * excluded because they cannot transition further.
     *
     * @return list<string>
     */
    private function nonTerminalStates(): array
    {
        return [
            InvitationStatus::Pending->value,
            InvitationStatus::Delivered->value,
            InvitationStatus::Opened->value,
            InvitationStatus::Clicked->value,
            InvitationStatus::Bounced->value,
        ];
    }
}
