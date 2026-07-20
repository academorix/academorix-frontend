<?php

declare(strict_types=1);

namespace Academorix\FinanceExpensesSdk\Requests\Expenses;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\FinanceExpensesSdk\Data\ExpenseData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/expenses/{expense}` — show one Expense.
 *
 * @category ExpensesSdk
 *
 * @since    0.1.0
 */
final class ShowExpenseRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $expense                Path parameter — expense.
     */
    public function __construct(
        public readonly string $expense,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/expenses/' . rawurlencode($this->expense);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see ExpenseData}.
     */
    public function createDtoFromResponse(Response $response): ExpenseData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return ExpenseData::from($body);
    }
}
