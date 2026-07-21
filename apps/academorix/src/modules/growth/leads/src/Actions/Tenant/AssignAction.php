<?php

declare(strict_types=1);

namespace Stackra\Leads\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Leads\Contracts\Data\LeadActivityInterface;
use Stackra\Leads\Contracts\Data\LeadInterface;
use Stackra\Leads\Contracts\Repositories\LeadActivityRepositoryInterface;
use Stackra\Leads\Contracts\Repositories\LeadRepositoryInterface;
use Stackra\Leads\Data\LeadData;
use Stackra\Leads\Data\Requests\AssignLeadRequestData;
use Stackra\Leads\Enums\LeadActivityType;
use Stackra\Leads\Enums\LeadsPermission;
use Stackra\Leads\Events\LeadReassigned;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Container\Attributes\Auth;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Support\Facades\DB;

/**
 * `POST /api/v1/leads/{lead}/assign` — assign a lead to a staff owner.
 *
 * Writes three side effects atomically:
 *
 *   1. `leads.owner_id` is set to the new owner.
 *   2. A `LeadActivity` row of type `assignment` is written, carrying
 *      the previous + new owner ids in metadata for the audit trail.
 *   3. `LeadReassigned` fires after commit, so the tasks module (or
 *      any other downstream consumer) can create a follow-up work
 *      item for the newly-assigned owner.
 *
 * Idempotent when the payload's `ownerId` equals the lead's current
 * `owner_id` — no state change is recorded and no event fires.
 *
 * @category Leads
 *
 * @since    0.1.0
 */
#[AsAction(name: 'leads.assign')]
#[Post('/api/v1/leads/{lead}/assign')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
#[RequirePermission(LeadsPermission::LeadsAssign)]
final class AssignAction
{
    use AsController;

    public function __construct(
        private readonly LeadRepositoryInterface $leads,
        private readonly LeadActivityRepositoryInterface $activities,
        private readonly Dispatcher $events,
        #[Auth('sanctum')] private readonly AuthFactory $auth,
    ) {
    }

    /**
     * Route through the assignment machinery.
     *
     * @param  string                  $lead  ULID from the URL.
     * @param  AssignLeadRequestData   $data  Validated payload.
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException  When the row is absent or tenant-scoped out.
     */
    public function __invoke(string $lead, AssignLeadRequestData $data): LeadData
    {
        $row = $this->leads->findOrFail($lead);

        $previousOwnerId = $row->getAttribute(LeadInterface::ATTR_OWNER_ID);

        // Idempotent guard — same owner, nothing to do.
        if ($previousOwnerId === $data->ownerId) {
            return LeadData::from($row);
        }

        $now     = \now();
        $actorId = $this->currentActorId();

        DB::transaction(function () use ($row, $data, $previousOwnerId, $now, $actorId): void {
            $row->forceFill([
                LeadInterface::ATTR_OWNER_ID => $data->ownerId,
            ])->save();

            $this->activities->create([
                LeadActivityInterface::ATTR_LEAD_ID     => (string) $row->getKey(),
                LeadActivityInterface::ATTR_TYPE        => LeadActivityType::Assignment,
                LeadActivityInterface::ATTR_BODY        => $data->note ?? \sprintf(
                    'Assigned to %s',
                    $data->ownerId,
                ),
                LeadActivityInterface::ATTR_METADATA    => [
                    'from' => $previousOwnerId,
                    'to'   => $data->ownerId,
                ],
                LeadActivityInterface::ATTR_ACTOR_ID    => $actorId,
                LeadActivityInterface::ATTR_OCCURRED_AT => $now,
            ]);
        });

        $this->events->dispatch(new LeadReassigned(
            leadId: (string) $row->getKey(),
            tenantId: (string) $row->getAttribute(LeadInterface::ATTR_TENANT_ID),
            fromOwnerId: (string) ($previousOwnerId ?? ''),
            toOwnerId: $data->ownerId,
            reason: 'manual',
            actorId: (string) ($actorId ?? ''),
            at: $now->toIso8601String(),
        ));

        return LeadData::from($row->refresh());
    }

    /**
     * Best-effort resolution of the active actor.
     */
    private function currentActorId(): ?string
    {
        $user = $this->auth->guard('sanctum')->user();

        return $user === null ? null : (string) $user->getAuthIdentifier();
    }
}
