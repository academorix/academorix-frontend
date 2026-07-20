<?php

declare(strict_types=1);

namespace Academorix\SportsDevelopmentSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\SportsDevelopmentSdk\Data\PathwayStageData;
use Academorix\SportsDevelopmentSdk\Requests\PathwayStages\CreatePathwayStageRequest;
use Academorix\SportsDevelopmentSdk\Requests\PathwayStages\ListPathwayStagesRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `pathway-stages` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/PathwayStages/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category DevelopmentSdk
 *
 * @since    0.1.0
 */
final readonly class PathwayStagesResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every pathwaystage.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<PathwayStageData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListPathwayStagesRequest($page, $perPage))->dto();
    }


    /**
     * Create a pathwaystage.
     *
     * @param  CreatePathwayStagePayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return PathwayStageData
     */
    public function create(\Academorix\SportsDevelopmentSdk\Payloads\PathwayStages\CreatePathwayStagePayload $payload, ?string $idempotencyKey = null): PathwayStageData
    {
        return $this->connector->send(new CreatePathwayStageRequest($payload, $idempotencyKey))->dto();
    }
}
