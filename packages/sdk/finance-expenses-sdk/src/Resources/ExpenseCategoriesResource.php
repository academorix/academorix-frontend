<?php

declare(strict_types=1);

namespace Academorix\FinanceExpensesSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\FinanceExpensesSdk\Data\ExpenseCategoryData;
use Academorix\FinanceExpensesSdk\Requests\ExpenseCategories\CreateExpenseCategoryRequest;
use Academorix\FinanceExpensesSdk\Requests\ExpenseCategories\ListExpenseCategoriesRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `expense-categories` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/ExpenseCategories/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category ExpensesSdk
 *
 * @since    0.1.0
 */
final readonly class ExpenseCategoriesResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every expensecategory.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<ExpenseCategoryData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListExpenseCategoriesRequest($page, $perPage))->dto();
    }


    /**
     * Create a expensecategory.
     *
     * @param  CreateExpenseCategoryPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return ExpenseCategoryData
     */
    public function create(\Academorix\FinanceExpensesSdk\Payloads\ExpenseCategories\CreateExpenseCategoryPayload $payload, ?string $idempotencyKey = null): ExpenseCategoryData
    {
        return $this->connector->send(new CreateExpenseCategoryRequest($payload, $idempotencyKey))->dto();
    }
}
