<?php

declare(strict_types=1);

namespace Academorix\SportsDevelopmentSdk\Requests\ScoutingReports;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\SportsDevelopmentSdk\Data\ScoutingReportData;
use Academorix\SportsDevelopmentSdk\Payloads\ScoutingReports\CreateScoutingReportPayload;
use Saloon\Contracts\Body\HasBody;
use Saloon\Enums\Method;
use Saloon\Http\Response;
use Saloon\Traits\Body\HasJsonBody;

/**
 * `POST /api/v1/scouting-reports` — create a ScoutingReport.
 *
 * @category DevelopmentSdk
 *
 * @since    0.1.0
 */
final class CreateScoutingReportRequest extends BaseSdkRequest implements HasBody
{
    use HasJsonBody;

    /**
     * HTTP verb.
     */
    protected Method $method = Method::POST;

    /**
     * @param  CreateScoutingReportPayload      $payload         Validated payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     */
    public function __construct(
        public readonly CreateScoutingReportPayload $payload,
        public readonly ?string $idempotencyKey = null,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/scouting-reports';
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
     * {@see ScoutingReportData}.
     */
    public function createDtoFromResponse(Response $response): ScoutingReportData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return ScoutingReportData::from($body);
    }
}
