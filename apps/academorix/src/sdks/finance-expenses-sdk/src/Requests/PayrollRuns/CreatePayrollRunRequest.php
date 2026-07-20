<?php

declare(strict_types=1);

namespace Academorix\FinanceExpensesSdk\Requests\PayrollRuns;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\FinanceExpensesSdk\Data\PayrollRunData;
use Academorix\FinanceExpensesSdk\Payloads\PayrollRuns\CreatePayrollRunPayload;
use Saloon\Contracts\Body\HasBody;
use Saloon\Enums\Method;
use Saloon\Http\Response;
use Saloon\Traits\Body\HasJsonBody;

/**
 * `POST /api/v1/payroll-runs` — create a PayrollRun.
 *
 * @category ExpensesSdk
 *
 * @since    0.1.0
 */
final class CreatePayrollRunRequest extends BaseSdkRequest implements HasBody
{
    use HasJsonBody;

    /**
     * HTTP verb.
     */
    protected Method $method = Method::POST;

    /**
     * @param  CreatePayrollRunPayload          $payload         Validated payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     */
    public function __construct(
        public readonly CreatePayrollRunPayload $payload,
        public readonly ?string $idempotencyKey = null,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/payroll-runs';
    }

    /**
     * Serialise the payload into the JSON body. Spatie Data's
     * `toArray()` strips any `Optional` sentinel values, so the
     * server only sees fields the caller explicitly set.
     *
     * @return array<string, mixed>
     */
    protected function defaultBody(): array
    {
        return $this->payload->toArray();
    }

    /**
     * Attach the caller-supplied idempotency key when one was provided.
     *
     * @return array<string, string>
     */
    protected function defaultHeaders(): array
    {
        return $this->idempotencyKey !== null
            ? ['Idempotency-Key' => $this->idempotencyKey]
            : [];
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
