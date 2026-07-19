<?php

declare(strict_types=1);

namespace Academorix\GrowthCrmLeadsSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\GrowthCrmLeadsSdk\Data\TaskData;
use Academorix\GrowthCrmLeadsSdk\Requests\Tasks\CreateTaskRequest;
use Academorix\GrowthCrmLeadsSdk\Requests\Tasks\ListTasksRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `tasks` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/Tasks/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category CrmLeadsSdk
 *
 * @since    0.1.0
 */
final readonly class TasksResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every task.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<TaskData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListTasksRequest($page, $perPage))->dto();
    }


    /**
     * Create a task.
     *
     * @param  CreateTaskPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return TaskData
     */
    public function create(\Academorix\GrowthCrmLeadsSdk\Payloads\Tasks\CreateTaskPayload $payload, ?string $idempotencyKey = null): TaskData
    {
        return $this->connector->send(new CreateTaskRequest($payload, $idempotencyKey))->dto();
    }
}
