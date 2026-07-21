<?php

declare(strict_types=1);

namespace Stackra\FinanceExpensesSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\FinanceExpensesSdk\Data\BudgetData;
use Stackra\FinanceExpensesSdk\Requests\Budgets\CreateBudgetRequest;
use Stackra\FinanceExpensesSdk\Requests\Budgets\ListBudgetsRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `budgets` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/Budgets/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category ExpensesSdk
 *
 * @since    0.1.0
 */
final readonly class BudgetsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every budget.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<BudgetData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListBudgetsRequest($page, $perPage))->dto();
    }


    /**
     * Create a budget.
     *
     * @param  CreateBudgetPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return BudgetData
     */
    public function create(\Stackra\FinanceExpensesSdk\Payloads\Budgets\CreateBudgetPayload $payload, ?string $idempotencyKey = null): BudgetData
    {
        return $this->connector->send(new CreateBudgetRequest($payload, $idempotencyKey))->dto();
    }
}
