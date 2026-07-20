<?php

declare(strict_types=1);

namespace Academorix\Invitations\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Invitations\Contracts\Data\InvitationEventInterface;
use Academorix\Invitations\Contracts\Repositories\InvitationEventRepositoryInterface;
use Academorix\Invitations\Models\InvitationEvent;
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
