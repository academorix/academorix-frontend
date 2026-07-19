<?php

declare(strict_types=1);

namespace Academorix\FinanceExpensesSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\FinanceExpensesSdk\Data\CostCenterData;
use Academorix\FinanceExpensesSdk\Requests\CostCenters\ListCostCentersRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `cost-centers` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/CostCenters/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category ExpensesSdk
 *
 * @since    0.1.0
 */
final readonly class CostCentersResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every costcenter.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<CostCenterData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListCostCentersRequest($page, $perPage))->dto();
    }
}
