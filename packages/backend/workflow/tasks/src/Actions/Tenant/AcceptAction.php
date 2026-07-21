<?php

declare(strict_types=1);

namespace Stackra\Tasks\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tasks\Contracts\Data\TaskAssignmentInterface;
use Stackra\Tasks\Contracts\Repositories\TaskAssignmentRepositoryInterface;
use Stackra\Tasks\Data\TaskAssignmentData;
use Stackra\Tasks\Enums\TasksPermission;
use Stackra\Tasks\Events\TaskAssignmentAccepted;
use Stackra\Tasks\Exceptions\TaskAssignmentAlreadyResolvedException;
use Stackra\Tasks\Exceptions\TaskAssignmentNotYoursException;
use Illuminate\Container\Attributes\Auth;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Contracts\Events\Dispatcher;

/**
 * `POST /api/v1/tasks/{task}/assignments/{assignment}/accept` — the
 * assignee accepts their own assignment.
 *
 * Guards, in order:
 *
 *   1. Route-model check on `{assignment}` — 404 on tenant-scoped-out.
 *   2. `task_id` on the assignment MUST match `{task}` — refuse when
 *      the URL segments disagree (defence in depth against caller-
 *      crafted URL substitution).
 *   3. `user_id` on the assignment MUST equal the acting Sanctum user
 *      — an accept for another assignee is 403
 *      {@see TaskAssignmentNotYoursException}. Admin override goes
 *      through the assignment policy's `before()` hook.
 *   4. `accepted_at` MUST be NULL AND `declined_at` MUST be NULL AND
 *      `unassigned_at` MUST be NULL — an already-resolved assignment
 *      is 422 {@see TaskAssignmentAlreadyResolvedException}.
 *
 * On success: stamps `accepted_at`, fires {@see TaskAssignmentAccepted}
 * post-commit.
 *
 * @category Tasks
 *
 * @since    0.1.0
 */
#[AsAction(name: 'tasks.assignments.accept')]
#[Post('/api/v1/tasks/{task}/assignments/{assignment}/accept')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
#[RequirePermission(TasksPermission::TaskAssignmentsAccept)]
final class AcceptAction
{
    use AsController;

    public function __construct(
        private readonly TaskAssignmentRepositoryInterface $assignments,
        private readonly Dispatcher $events,
        #[Auth('sanctum')] private readonly AuthFactory $auth,
    ) {
    }

    /**
     * @param  string  $task        Parent task ULID (URL segment).
     * @param  string  $assignment  Assignment ULID (URL segment).
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException  Row absent / tenant-scoped out.
     * @throws \Stackra\Tasks\Exceptions\TaskAssignmentNotYoursException  Caller is not the assignee.
     * @throws \Stackra\Tasks\Exceptions\TaskAssignmentAlreadyResolvedException  Assignment is already resolved.
     */
    public function __invoke(string $task, string $assignment): TaskAssignmentData
    {
        $row = $this->assignments->findOrFail($assignment);

        // URL-segment cross-check — the task in the URL must match
        // the assignment's task_id. A mismatch is a caller error.
        if ($row->getAttribute(TaskAssignmentInterface::ATTR_TASK_ID) !== $task) {
            throw (new TaskAssignmentAlreadyResolvedException(
                'Assignment does not belong to the referenced task.',
            ))->withContext([
                'assignment_task_id' => (string) $row->getAttribute(TaskAssignmentInterface::ATTR_TASK_ID),
                'url_task_id'        => $task,
            ]);
        }

        $actor = $this->auth->guard('sanctum')->user();

        // Ownership guard — only the assignee can accept their own row.
        // The policy's before() hook grants admin an override.
        if ($actor === null
            || (string) $actor->getAuthIdentifier() !== (string) $row->getAttribute(TaskAssignmentInterface::ATTR_USER_ID)) {
            throw (new TaskAssignmentNotYoursException(
                'Only the assignee may accept this assignment.',
            ))->withContext([
                'assignment_id' => (string) $row->getKey(),
            ]);
        }

        // Terminal-state guard — accepted / declined / unassigned rows
        // cannot be re-accepted.
        if ($row->getAttribute(TaskAssignmentInterface::ATTR_ACCEPTED_AT) !== null
            || $row->getAttribute(TaskAssignmentInterface::ATTR_DECLINED_AT) !== null
            || $row->getAttribute(TaskAssignmentInterface::ATTR_UNASSIGNED_AT) !== null) {
            throw (new TaskAssignmentAlreadyResolvedException(
                'Assignment is already resolved.',
            ))->withContext([
                'assignment_id' => (string) $row->getKey(),
                'accepted_at'   => (string) $row->getAttribute(TaskAssignmentInterface::ATTR_ACCEPTED_AT),
                'declined_at'   => (string) $row->getAttribute(TaskAssignmentInterface::ATTR_DECLINED_AT),
                'unassigned_at' => (string) $row->getAttribute(TaskAssignmentInterface::ATTR_UNASSIGNED_AT),
            ]);
        }

        $now = \now();

        $row->forceFill([
            TaskAssignmentInterface::ATTR_ACCEPTED_AT => $now,
        ])->save();

        $this->events->dispatch(new TaskAssignmentAccepted(
            assignmentId: (string) $row->getKey(),
            taskId: $task,
            userId: (string) $row->getAttribute(TaskAssignmentInterface::ATTR_USER_ID),
            at: $now->toIso8601String(),
        ));

        return TaskAssignmentData::from($row->refresh());
    }
}
