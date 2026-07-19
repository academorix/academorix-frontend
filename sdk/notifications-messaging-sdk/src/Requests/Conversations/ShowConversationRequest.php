<?php

declare(strict_types=1);

namespace Academorix\NotificationsMessagingSdk\Requests\Conversations;

use Academorix\ApiSdk\Requests\BaseSdkRequest;
use Academorix\NotificationsMessagingSdk\Data\ConversationData;
use Saloon\Enums\Method;
use Saloon\Http\Response;

/**
 * `GET /api/v1/conversations/{conversation}` — show one Conversation.
 *
 * @category MessagingSdk
 *
 * @since    0.1.0
 */
final class ShowConversationRequest extends BaseSdkRequest
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
        return '/api/v1/conversations/' . rawurlencode($this->conversation);
    }

    /**
     * Hydrate the `{ "data": ... }` envelope into a
     * {@see ConversationData}.
     */
    public function createDtoFromResponse(Response $response): ConversationData
    {
        /** @var array<string, mixed> $payload */
        $payload = $response->json();
        /** @var array<string, mixed> $body */
        $body = isset($payload['data']) && is_array($payload['data'])
            ? $payload['data']
            : $payload;

        return ConversationData::from($body);
    }
}
