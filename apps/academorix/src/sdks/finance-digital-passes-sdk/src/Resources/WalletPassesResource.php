<?php

declare(strict_types=1);

namespace Stackra\FinanceDigitalPassesSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\FinanceDigitalPassesSdk\Data\WalletPassData;
use Stackra\FinanceDigitalPassesSdk\Requests\WalletPasses\CreateWalletPassRequest;
use Stackra\FinanceDigitalPassesSdk\Requests\WalletPasses\ListWalletPassesRequest;
use Stackra\FinanceDigitalPassesSdk\Requests\WalletPasses\ShowWalletPassRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `wallet-passes` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/WalletPasses/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category DigitalPassesSdk
 *
 * @since    0.1.0
 */
final readonly class WalletPassesResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every walletpass.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<WalletPassData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListWalletPassesRequest($page, $perPage))->dto();
    }


    /**
     * Create a walletpass.
     *
     * @param  CreateWalletPassPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return WalletPassData
     */
    public function create(\Stackra\FinanceDigitalPassesSdk\Payloads\WalletPasses\CreateWalletPassPayload $payload, ?string $idempotencyKey = null): WalletPassData
    {
        return $this->connector->send(new CreateWalletPassRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Show one walletpass.
     *
     * @param  string  $pass                   Path parameter — pass.
     *
     * @return WalletPassData
     */
    public function show(string $pass): WalletPassData
    {
        return $this->connector->send(new ShowWalletPassRequest($pass))->dto();
    }
}
