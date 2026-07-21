<?php

declare(strict_types=1);

namespace Stackra\SportsDrillsSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\SportsDrillsSdk\Data\DrillCategoryData;
use Stackra\SportsDrillsSdk\Requests\DrillCategories\CreateDrillCategoryRequest;
use Stackra\SportsDrillsSdk\Requests\DrillCategories\ListDrillCategoriesRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `drill-categories` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/DrillCategories/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category DrillsSdk
 *
 * @since    0.1.0
 */
final readonly class DrillCategoriesResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every drillcategory.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<DrillCategoryData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListDrillCategoriesRequest($page, $perPage))->dto();
    }


    /**
     * Create a drillcategory.
     *
     * @param  CreateDrillCategoryPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return DrillCategoryData
     */
    public function create(\Stackra\SportsDrillsSdk\Payloads\DrillCategories\CreateDrillCategoryPayload $payload, ?string $idempotencyKey = null): DrillCategoryData
    {
        return $this->connector->send(new CreateDrillCategoryRequest($payload, $idempotencyKey))->dto();
    }
}
