<?php

declare(strict_types=1);

namespace Academorix\SportsDrillsSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\SportsDrillsSdk\Data\CurriculumData;
use Academorix\SportsDrillsSdk\Requests\Curriculums\CreateCurriculumRequest;
use Academorix\SportsDrillsSdk\Requests\Curriculums\ListCurriculumsRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `curriculums` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/Curriculums/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category DrillsSdk
 *
 * @since    0.1.0
 */
final readonly class CurriculumsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every curriculum.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<CurriculumData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListCurriculumsRequest($page, $perPage))->dto();
    }


    /**
     * Create a curriculum.
     *
     * @param  CreateCurriculumPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return CurriculumData
     */
    public function create(\Academorix\SportsDrillsSdk\Payloads\Curriculums\CreateCurriculumPayload $payload, ?string $idempotencyKey = null): CurriculumData
    {
        return $this->connector->send(new CreateCurriculumRequest($payload, $idempotencyKey))->dto();
    }
}
