<?php

declare(strict_types=1);

namespace Academorix\Invitations\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Invitations\Models\InvitationEvent;
use Academorix\Invitations\Repositories\EloquentInvitationEventRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see InvitationEvent}.
 *
 * Append-only audit log — this repository ships CRUD (via the base
 * generic) plus the idempotency check + timeline read the observer
 * and the audit-report command need.
 *
 * @extends RepositoryInterface<InvitationEvent>
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
#[Bind(EloquentInvitationEventRepository::class)]
interface InvitationEventRepositoryInterface extends RepositoryInterface
{
    /**
     * Whether the given `(transport, signal_id)` pair has already
     * been recorded — backs the mail-transport webhook idempotency
     * guard.
     */
    public function hasSignal(string $transport, string $signalId): bool;

    /**
     * Timeline for an invitation, ordered by `occurred_at` DESC.
     *
     * @return Collection<int, InvitationEvent>
     */
    public function timeline(string $invitationId): Collection;
}
