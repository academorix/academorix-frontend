<?php

declare(strict_types=1);

namespace Stackra\Leads\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Leads\Contracts\Data\LeadTaskInterface;
use Stackra\Leads\Contracts\Repositories\LeadTaskRepositoryInterface;
use Stackra\Leads\Data\LeadTaskData;
use Stackra\Leads\Enums\LeadsPermission;
use Stackra\Leads\Enums\LeadTaskStatus;
use Stackra\Leads\Exceptions\LeadTaskAlreadyCompletedException;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Container\Attributes\Auth;
use Illuminate\Contracts\Auth\Factory as AuthFactory;

/**
 * `POST /api/v1/lead-tasks/{lead_task}/complete` — mark a lead task
 * as completed.
 *
 * Terminal transition: `open` / `in_progress` → `completed`. Refuses
 * to complete an already-completed OR cancelled task with
 * {@see \Stackra\Leads\Exceptions\LeadTaskAlreadyCompletedException}
 * (422). Records the completer id + timestamp for the audit trail.
 *
 * The action-level policy check narrows further — the
 * `lead-tasks.complete` permission is assignee-only via
 * {@see \Stackra\Leads\Policies\LeadTaskPolicy}. Admin + owner
 * override is applied by the policy's `before()` hook.
 *
 * @category Leads
 *
 * @since    0.1.0
 */
#[AsAction(name: 'leads.tasks.complete')]
#[Post('/api/v1/lead-tasks/{lead_task}/complete')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
#[RequirePermission(LeadsPermission::LeadTasksComplete)]
final class CompleteAction
{
    use AsController;

    public function __construct(
        private readonly LeadTaskRepositoryInterface $tasks,
        #[Auth('sanctum')] private readonly AuthFactory $auth,
    ) {
    }

    /**
     * @param  string  $lead_task  ULID from the URL.
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException  When the row is absent.
     * @throws \Stackra\Leads\Exceptions\LeadTaskAlreadyCompletedException  When the task is already in a terminal state.
     */
    public function __invoke(string $lead_task): LeadTaskData
    {
        $row = $this->tasks->findOrFail($lead_task);

        // Guard against re-completion — a completed OR cancelled task
        // is terminal. The 422 surface is deliberate: callers should
        // detect the state up front and hide the button, but a
        // stale-tab retry MUST NOT silently succeed and rewrite the
        // completion timestamp.
        $currentStatus = $row->getAttribute(LeadTaskInterface::ATTR_STATUS);

        if ($currentStatus === LeadTaskStatus::Completed || $currentStatus === LeadTaskStatus::Cancelled) {
            throw (new LeadTaskAlreadyCompletedException(
                'Lead task is already in a terminal state.',
            ))->withContext([
                'lead_task_id'   => (string) $row->getKey(),
                'current_status' => $currentStatus?->value,
            ]);
        }

        $now       = \now();
        $completer = $this->currentActorId();

        $row->forceFill([
            LeadTaskInterface::ATTR_STATUS       => LeadTaskStatus::Completed,
            LeadTaskInterface::ATTR_COMPLETED_AT => $now,
            LeadTaskInterface::ATTR_COMPLETED_BY => $completer,
        ])->save();

        return LeadTaskData::from($row->refresh());
    }

    /**
     * Best-effort resolution of the actor completing the task.
     */
    private function currentActorId(): ?string
    {
        $user = $this->auth->guard('sanctum')->user();

        return $user === null ? null : (string) $user->getAuthIdentifier();
    }
}
