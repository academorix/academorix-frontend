<?php

declare(strict_types=1);

namespace Academorix\Tasks\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tasks\Contracts\Data\TaskAssignmentInterface;
use Academorix\Tasks\Contracts\Repositories\TaskAssignmentRepositoryInterface;
use Academorix\Tasks\Data\Requests\DeclineAssignmentRequestData;
use Academorix\Tasks\Data\TaskAssignmentData;
use Academorix\Tasks\Enums\TasksPermission;
use Academorix\Tasks\Events\TaskAssignmentDeclined;
use Academorix\Tasks\Exceptions\TaskAssignmentAlreadyResolvedException;
use Academorix\Tasks\Exceptions\TaskAssignmentNotYoursException;
use Illuminate\Container\Attributes\Auth;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Contracts\Events\Dispatcher;

/**
 * `POST /api/v1/tasks/{task}/assignments/{assignment}/decline` — the
 * assignee declines their own assignment with a reason.
 *
 * Same guard chain as {@see AcceptAction}: URL cross-check + ownership
 * + terminal-state refusal. On success, stamps `declined_at` +
 * `declined_reason`, fires {@see TaskAssignmentDeclined}. The
 * reassignment workflow (creating a new pending assignment on a
 * fallback user) is downstream — the notifications module listens
 * to the event and pings a task admin.
 *
 * @category Tasks
 *
 * @since    0.1.0
 */
#[AsAction(name: 'tasks.assignments.decline')]
#[Post('/api/v1/tasks/{task}/assignments/{assignment}/decline')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
#[RequirePermission(TasksPermission::TaskAssignmentsDecline)]
final class DeclineAction
{
    use AsController;

    public function __construct(
        private readonly TaskAssignmentRepositoryInterface $assignments,
        private readonly Dispatcher $events,
        #[Auth('sanctum')] private readonly AuthFactory $auth,
    ) {
    }

    /**
     * @param  string                        $task        Parent task ULID.
     * @param  string                        $assignment  Assignment ULID.
     * @param  DeclineAssignmentRequestData  $data        Validated payload.
     *
     * @throws \Academorix\Tasks\Exceptions\TaskAssignmentNotYoursException
     * @throws \Academorix\Tasks\Exceptions\TaskAssignmentAlreadyResolvedException
     */
    public function __invoke(string $task, string $assignment, DeclineAssignmentRequestData $data): TaskAssignmentData
    {
        $row = $this->assignments->findOrFail($assignment);

        if ($row->getAttribute(TaskAssignmentInterface::ATTR_TASK_ID) !== $task) {
            throw (new TaskAssignmentAlreadyResolvedException(
                'Assignment does not belong to the referenced task.',
            ))->withContext([
                'assignment_task_id' => (string) $row->getAttribute(TaskAssignmentInterface::ATTR_TASK_ID),
                'url_task_id'        => $task,
            ]);
        }

        $actor = $this->auth->guard('sanctum')->user();

        if ($actor === null
            || (string) $actor->getAuthIdentifier() !== (string) $row->getAttribute(TaskAssignmentInterface::ATTR_USER_ID)) {
            throw (new TaskAssignmentNotYoursException(
                'Only the assignee may decline this assignment.',
            ))->withContext([
                'assignment_id' => (string) $row->getKey(),
            ]);
        }

        if ($row->getAttribute(TaskAssignmentInterface::ATTR_ACCEPTED_AT) !== null
            || $row->getAttribute(TaskAssignmentInterface::ATTR_DECLINED_AT) !== null
            || $row->getAttribute(TaskAssignmentInterface::ATTR_UNASSIGNED_AT) !== null) {
            throw (new TaskAssignmentAlreadyResolvedException(
                'Assignment is already resolved.',
            ))->withContext([
                'assignment_id' => (string) $row->getKey(),
            ]);
        }

        $now = \now();

        $row->forceFill([
            TaskAssignmentInterface::ATTR_DECLINED_AT     => $now,
            TaskAssignmentInterface::ATTR_DECLINED_REASON => $data->reason,
        ])->save();

        $this->events->dispatch(new TaskAssignmentDeclined(
            assignmentId: (string) $row->getKey(),
            taskId: $task,
            userId: (string) $row->getAttribute(TaskAssignmentInterface::ATTR_USER_ID),
            reason: $data->reason,
            at: $now->toIso8601String(),
        ));

        return TaskAssignmentData::from($row->refresh());
    }
}
