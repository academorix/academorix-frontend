<?php

declare(strict_types=1);

namespace Academorix\FinanceExpensesSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\FinanceExpensesSdk\Data\PayrollLineData;
use Saloon\Http\Response;

/**
 * Peer Resource for the `payroll-lines` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/PayrollLines/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category ExpensesSdk
 *
 * @since    0.1.0
 */
final readonly class PayrollLinesResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

}
