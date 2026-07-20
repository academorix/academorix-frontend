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
use Academorix\Tasks\Events\TaskCancelled;
use Academorix\Tasks\Exceptions\TaskTerminalStateException;
use Illuminate\Contracts\Events\Dispatcher;

/**
 * `POST /api/v1/tasks/{task}/cancel` — cancel a task.
 *
 * Symmetric to {@see CompleteAction}, but transitions to
 * `cancelled` instead. Any non-terminal state
 * (`open` / `in_progress` / `blocked`) can be cancelled; already-
 * terminal tasks are 422 {@see TaskTerminalStateException}.
 *
 * On success: stamps `cancelled_at`, fires {@see TaskCancelled}
 * post-commit. Downstream consumers (audit + activity) log the
 * transition; the task is NOT deleted — soft-delete is a separate
 * operation (`tasks.delete`).
 *
 * @category Tasks
 *
 * @since    0.1.0
 */
#[AsAction(name: 'tasks.cancel')]
#[Post('/api/v1/tasks/{task}/cancel')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
#[RequirePermission(TasksPermission::TasksCancel)]
final class CancelAction
{
    use AsController;

    public function __construct(
        private readonly TaskRepositoryInterface $tasks,
        private readonly Dispatcher $events,
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

        $now = \now();

        $row->forceFill([
            TaskInterface::ATTR_STATUS       => TaskStatus::Cancelled,
            TaskInterface::ATTR_CANCELLED_AT => $now,
        ])->save();

        $this->events->dispatch(new TaskCancelled(
            taskId: (string) $row->getKey(),
            tenantId: (string) $row->getAttribute(TaskInterface::ATTR_TENANT_ID),
            at: $now->toIso8601String(),
        ));

        return TaskData::from($row->refresh());
    }
}
