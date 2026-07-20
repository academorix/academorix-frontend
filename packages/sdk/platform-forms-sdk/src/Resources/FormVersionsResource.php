<?php

declare(strict_types=1);

namespace Academorix\PlatformFormsSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\PlatformFormsSdk\Data\FormVersionData;
use Saloon\Http\Response;

/**
 * Peer Resource for the `form-versions` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/FormVersions/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category FormsSdk
 *
 * @since    0.1.0
 */
final readonly class FormVersionsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

}
