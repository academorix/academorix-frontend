<?php

declare(strict_types=1);

namespace Stackra\FinanceDigitalPassesSdk\Requests\WalletPasses;

use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Stackra\FinanceDigitalPassesSdk\Data\WalletPassData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/wallet-passes/{pass}` — show one WalletPass.
 *
 * @category DigitalPassesSdk
 *
 * @since    0.1.0
 */
final class ShowWalletPassRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $pass                   Path parameter — pass.
     */
    public function __construct(
        public readonly string $pass,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/wallet-passes/' . rawurlencode($this->pass);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see WalletPassData}.
     */
    public function createDtoFromResponse(Response $response): WalletPassData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return WalletPassData::from($body);
    }
}
