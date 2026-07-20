<?php

declare(strict_types=1);

namespace Academorix\Tasks\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tasks\Contracts\Data\TaskInterface;
use Academorix\Tasks\Contracts\Repositories\TaskRepositoryInterface;
use Academorix\Tasks\Data\TaskData;
use Academorix\Tasks\Enums\TasksPermission;
use Academorix\Tasks\Enums\TaskStatus;
use Academorix\Tasks\Events\TaskCompleted;
use Academorix\Tasks\Exceptions\TaskTerminalStateException;
use Illuminate\Container\Attributes\Auth;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Contracts\Events\Dispatcher;

/**
 * `POST /api/v1/tasks/{task}/complete` — mark a task as completed.
 *
 * Transitions the task's `status` field from any non-terminal state
 * (`open` / `in_progress` / `blocked`) to `completed`, stamps
 * `completed_at`, and fires {@see TaskCompleted} post-commit.
 * Terminal (already `completed` / `cancelled`) task rows are 422
 * {@see TaskTerminalStateException} — a stale-tab retry MUST NOT
 * silently rewrite the completion timestamp.
 *
 * The policy authorising this route is layered by
 * {@see \Academorix\Tasks\Policies\TaskPolicy::complete()} — the
 * assignee OR admin OR the task's creator can complete. The
 * `#[RequirePermission]` guard checks the capability; the policy
 * check narrows further to the specific row.
 *
 * @category Tasks
 *
 * @since    0.1.0
 */
#[AsAction(name: 'tasks.complete')]
#[Post('/api/v1/tasks/{task}/complete')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
#[RequirePermission(TasksPermission::TasksComplete)]
final class CompleteAction
{
    use AsController;

    public function __construct(
        private readonly TaskRepositoryInterface $tasks,
        private readonly Dispatcher $events,
        #[Auth('sanctum')] private readonly AuthFactory $auth,
    ) {
    }

    /**
     * @param  string  $task  ULID from the URL.
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException  Row absent / scoped out.
     * @throws \Academorix\Tasks\Exceptions\TaskTerminalStateException  Task is already terminal.
     */
    public function __invoke(string $task): TaskData
    {
        $row = $this->tasks->findOrFail($task);

        $current = $row->getAttribute(TaskInterface::ATTR_STATUS);

        if ($current === TaskStatus::Completed || $current === TaskStatus::Cancelled) {
            throw (new TaskTerminalStateException(
                'Task is already in a terminal state.',
            ))->withContext([
                'task_id'        => (string) $row->getKey(),
                'current_status' => $current?->value,
            ]);
        }

        $now      = \now();
        $actor    = $this->auth->guard('sanctum')->user();
        $actorId  = $actor === null ? null : (string) $actor->getAuthIdentifier();

        $row->forceFill([
            TaskInterface::ATTR_STATUS       => TaskStatus::Completed,
            TaskInterface::ATTR_COMPLETED_AT => $now,
        ])->save();

        $this->events->dispatch(new TaskCompleted(
            taskId: (string) $row->getKey(),
            tenantId: (string) $row->getAttribute(TaskInterface::ATTR_TENANT_ID),
            completedBy: (string) ($actorId ?? ''),
            at: $now->toIso8601String(),
        ));

        return TaskData::from($row->refresh());
    }
}
