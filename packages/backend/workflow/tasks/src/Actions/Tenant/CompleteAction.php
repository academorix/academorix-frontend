<?php

declare(strict_types=1);

namespace Stackra\Tasks\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tasks\Contracts\Data\TaskInterface;
use Stackra\Tasks\Contracts\Repositories\TaskRepositoryInterface;
use Stackra\Tasks\Data\TaskData;
use Stackra\Tasks\Enums\TasksPermission;
use Stackra\Tasks\Enums\TaskStatus;
use Stackra\Tasks\Events\TaskCompleted;
use Stackra\Tasks\Exceptions\TaskTerminalStateException;
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
 * {@see \Stackra\Tasks\Policies\TaskPolicy::complete()} — the
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
     * @throws \Stackra\Tasks\Exceptions\TaskTerminalStateException  Task is already terminal.
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
