<?php

declare(strict_types=1);

namespace Stackra\SportsProgressSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\SportsProgressSdk\Data\GradingEventData;
use Stackra\SportsProgressSdk\Requests\GradingEvents\CreateGradingEventRequest;
use Stackra\SportsProgressSdk\Requests\GradingEvents\ListGradingEventsAdminRequest;
use Stackra\SportsProgressSdk\Requests\GradingEvents\ListGradingEventsRequest;
use Stackra\SportsProgressSdk\Requests\GradingEvents\ShowGradingEventRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `grading-events` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/GradingEvents/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category ProgressSdk
 *
 * @since    0.1.0
 */
final readonly class GradingEventsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every gradingevent.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<GradingEventData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListGradingEventsRequest($page, $perPage))->dto();
    }


    /**
     * Create a gradingevent.
     *
     * @param  CreateGradingEventPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return GradingEventData
     */
    public function create(\Stackra\SportsProgressSdk\Payloads\GradingEvents\CreateGradingEventPayload $payload, ?string $idempotencyKey = null): GradingEventData
    {
        return $this->connector->send(new CreateGradingEventRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Show one gradingevent.
     *
     * @param  string  $event                  Path parameter — event.
     *
     * @return GradingEventData
     */
    public function show(string $event): GradingEventData
    {
        return $this->connector->send(new ShowGradingEventRequest($event))->dto();
    }


    /**
     * List every gradingevent.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<GradingEventData>
     */
    public function listAdmin(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListGradingEventsAdminRequest($page, $perPage))->dto();
    }
}
