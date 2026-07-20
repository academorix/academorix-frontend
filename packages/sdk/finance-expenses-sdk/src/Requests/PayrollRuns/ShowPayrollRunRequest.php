<?php

declare(strict_types=1);

namespace Academorix\FinanceExpensesSdk\Requests\PayrollRuns;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\FinanceExpensesSdk\Data\PayrollRunData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/payroll-runs/{run}` — show one PayrollRun.
 *
 * @category ExpensesSdk
 *
 * @since    0.1.0
 */
final class ShowPayrollRunRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $run                    Path parameter — run.
     */
    public function __construct(
        public readonly string $run,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/payroll-runs/' . rawurlencode($this->run);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see PayrollRunData}.
     */
    public function createDtoFromResponse(Response $response): PayrollRunData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return PayrollRunData::from($body);
    }
}
