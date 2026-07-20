<?php

declare(strict_types=1);

namespace Academorix\SportsRegistrationsSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\SportsRegistrationsSdk\Data\WaitlistEntryData;
use Academorix\SportsRegistrationsSdk\Requests\WaitlistEntries\DeleteWaitlistEntryRequest;
use Academorix\SportsRegistrationsSdk\Requests\WaitlistEntries\ListWaitlistEntriesRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `waitlist-entries` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/WaitlistEntries/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category RegistrationsSdk
 *
 * @since    0.1.0
 */
final readonly class WaitlistEntriesResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every waitlistentry.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<WaitlistEntryData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListWaitlistEntriesRequest($page, $perPage))->dto();
    }


    /**
     * Delete one waitlistentry.
     *
     * @param  string  $entry                  Path parameter — entry.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     */
    public function delete(string $entry, ?string $idempotencyKey = null): void
    {
        $this->connector->send(new DeleteWaitlistEntryRequest($entry, $idempotencyKey));
    }
}
