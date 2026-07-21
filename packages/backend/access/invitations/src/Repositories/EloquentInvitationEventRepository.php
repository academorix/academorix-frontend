<?php

declare(strict_types=1);

namespace Stackra\Invitations\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Invitations\Contracts\Data\InvitationEventInterface;
use Stackra\Invitations\Contracts\Repositories\InvitationEventRepositoryInterface;
use Stackra\Invitations\Models\InvitationEvent;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of
 * {@see InvitationEventRepositoryInterface}.
 *
 * `InvitationEvent` is append-only — no cache tags because writes
 * only append new rows (never invalidate old ones), and the audit
 * report command reads the raw table anyway. Skipping the cache
 * keeps the retention purge simple.
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(InvitationEventInterface::class)]
#[Filterable([
    InvitationEventInterface::ATTR_TENANT_ID      => ['$eq', '$in'],
    InvitationEventInterface::ATTR_APPLICATION_ID => ['$eq', '$in'],
    InvitationEventInterface::ATTR_INVITATION_ID  => ['$eq', '$in'],
    InvitationEventInterface::ATTR_EVENT          => ['$eq', '$in'],
    InvitationEventInterface::ATTR_TRANSPORT      => ['$eq', '$in'],
    InvitationEventInterface::ATTR_ERROR_CODE     => ['$eq', '$in'],
])]
final class EloquentInvitationEventRepository extends Repository implements InvitationEventRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function hasSignal(string $transport, string $signalId): bool
    {
        return $this->query()
            ->where(InvitationEventInterface::ATTR_TRANSPORT, $transport)
            ->where(InvitationEventInterface::ATTR_SIGNAL_ID, $signalId)
            ->exists();
    }

    /**
     * {@inheritDoc}
     */
    public function timeline(string $invitationId): Collection
    {
        /** @var Collection<int, InvitationEvent> $rows */
        $rows = $this->query()
            ->where(InvitationEventInterface::ATTR_INVITATION_ID, $invitationId)
            ->orderByDesc(InvitationEventInterface::ATTR_OCCURRED_AT)
            ->get();

        return $rows;
    }
}
