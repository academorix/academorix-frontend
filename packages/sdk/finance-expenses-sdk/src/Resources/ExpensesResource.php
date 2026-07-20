<?php

declare(strict_types=1);

namespace Academorix\FinanceExpensesSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\FinanceExpensesSdk\Data\ExpenseData;
use Academorix\FinanceExpensesSdk\Requests\Expenses\CreateExpenseRequest;
use Academorix\FinanceExpensesSdk\Requests\Expenses\ListExpensesRequest;
use Academorix\FinanceExpensesSdk\Requests\Expenses\ShowExpenseRequest;
use Academorix\FinanceExpensesSdk\Requests\Expenses\UpdateExpenseRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `expenses` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/Expenses/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category ExpensesSdk
 *
 * @since    0.1.0
 */
final readonly class ExpensesResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every expense.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<ExpenseData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListExpensesRequest($page, $perPage))->dto();
    }


    /**
     * Create a expense.
     *
     * @param  CreateExpensePayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return ExpenseData
     */
    public function create(\Academorix\FinanceExpensesSdk\Payloads\Expenses\CreateExpensePayload $payload, ?string $idempotencyKey = null): ExpenseData
    {
        return $this->connector->send(new CreateExpenseRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Show one expense.
     *
     * @param  string  $expense                Path parameter — expense.
     *
     * @return ExpenseData
     */
    public function show(string $expense): ExpenseData
    {
        return $this->connector->send(new ShowExpenseRequest($expense))->dto();
    }


    /**
     * Update one expense.
     *
     * @param  string  $expense                Path parameter — expense.
     * @param  UpdateExpensePayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return ExpenseData
     */
    public function update(string $expense, \Academorix\FinanceExpensesSdk\Payloads\Expenses\UpdateExpensePayload $payload, ?string $idempotencyKey = null): ExpenseData
    {
        return $this->connector->send(new UpdateExpenseRequest($expense, $payload, $idempotencyKey))->dto();
    }
}
