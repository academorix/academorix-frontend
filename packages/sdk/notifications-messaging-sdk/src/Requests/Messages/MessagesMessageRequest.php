<?php

declare(strict_types=1);

namespace Stackra\NotificationsMessagingSdk\Requests\Messages;

use Stackra\ApiSdk\Requests\BaseSdkRequest;
use Stackra\NotificationsMessagingSdk\Data\MessageData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/conversations/{conversation}/messages` — custom — custom endpoint (hand-implement).
 *
 * @category MessagingSdk
 *
 * @since    0.1.0
 */
final class MessagesMessageRequest extends BaseSdkRequest
{
    /**
     * HTTP verb.
     */
    protected Method $method = Method::GET;

    /**
     * @param  string       $conversation           Path parameter — conversation.
     */
    public function __construct(
        public readonly string $conversation,
    ) {
    }

    /**
     * Return the request path relative to the connector base URL.
     */
    public function resolveEndpoint(): string
    {
        return '/api/v1/conversations/' . rawurlencode($this->conversation) . '/messages';
    }

    /**
     * Custom endpoint — hand-implement the response shape here.
     *
     * @return mixed
     */
    public function createDtoFromResponse(Response $response): mixed
    {
        // TODO(sdk): hand-implement — this custom endpoint's response
        // shape is not covered by the standard CRUD template. Return
        // the appropriate DTO from src/Data/ once the shape is
        // clarified.
        return $response->json();
    }
}
