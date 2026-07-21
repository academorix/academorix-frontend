<?php

declare(strict_types=1);

namespace Stackra\SportsAwardsSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\SportsAwardsSdk\Data\CertificateData;
use Stackra\SportsAwardsSdk\Requests\Certificates\ShowCertificateRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `certificates` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/Certificates/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category AwardsSdk
 *
 * @since    0.1.0
 */
final readonly class CertificatesResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * Show one certificate.
     *
     * @param  string  $certificate            Path parameter — certificate.
     *
     * @return CertificateData
     */
    public function show(string $certificate): CertificateData
    {
        return $this->connector->send(new ShowCertificateRequest($certificate))->dto();
    }


    /**
     * Show one certificate.
     *
     * @param  string  $signature              Path parameter — signature.
     *
     * @return CertificateData
     */
    public function show(string $signature): CertificateData
    {
        return $this->connector->send(new ShowCertificateRequest($signature))->dto();
    }
}
