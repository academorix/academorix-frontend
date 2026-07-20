<?php

declare(strict_types=1);

namespace Academorix\FinanceExpensesSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\FinanceExpensesSdk\Data\PayrollRunData;
use Academorix\FinanceExpensesSdk\Requests\PayrollRuns\CreatePayrollRunRequest;
use Academorix\FinanceExpensesSdk\Requests\PayrollRuns\ListPayrollRunsRequest;
use Academorix\FinanceExpensesSdk\Requests\PayrollRuns\ShowPayrollRunRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `payroll-runs` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/PayrollRuns/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category ExpensesSdk
 *
 * @since    0.1.0
 */
final readonly class PayrollRunsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every payrollrun.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<PayrollRunData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListPayrollRunsRequest($page, $perPage))->dto();
    }


    /**
     * Create a payrollrun.
     *
     * @param  CreatePayrollRunPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return PayrollRunData
     */
    public function create(\Academorix\FinanceExpensesSdk\Payloads\PayrollRuns\CreatePayrollRunPayload $payload, ?string $idempotencyKey = null): PayrollRunData
    {
        return $this->connector->send(new CreatePayrollRunRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Show one payrollrun.
     *
     * @param  string  $run                    Path parameter — run.
     *
     * @return PayrollRunData
     */
    public function show(string $run): PayrollRunData
    {
        return $this->connector->send(new ShowPayrollRunRequest($run))->dto();
    }
}
