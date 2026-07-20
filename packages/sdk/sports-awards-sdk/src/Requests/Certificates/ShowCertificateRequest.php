<?php

declare(strict_types=1);

namespace Academorix\SportsAwardsSdk\Requests\Certificates;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\SportsAwardsSdk\Data\CertificateData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/certificates/{certificate}` — show one Certificate.
 *
 * @category AwardsSdk
 *
 * @since    0.1.0
 */
final class ShowCertificateRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $certificate            Path parameter — certificate.
     */
    public function __construct(
        public readonly string $certificate,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/certificates/' . rawurlencode($this->certificate);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see CertificateData}.
     */
    public function createDtoFromResponse(Response $response): CertificateData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return CertificateData::from($body);
    }
}
