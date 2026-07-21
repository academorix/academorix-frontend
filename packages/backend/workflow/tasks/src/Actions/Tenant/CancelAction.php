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
use Stackra\Tasks\Events\TaskCancelled;
use Stackra\Tasks\Exceptions\TaskTerminalStateException;
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
