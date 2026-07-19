<?php

declare(strict_types=1);

namespace Academorix\NotificationsMessagingSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\NotificationsMessagingSdk\Data\MessageData;
use Academorix\NotificationsMessagingSdk\Requests\Messages\MessagesMessageRequest;
use Academorix\NotificationsMessagingSdk\Requests\Messages\UpdateMessageRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `messages` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/Messages/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category MessagingSdk
 *
 * @since    0.1.0
 */
final readonly class MessagesResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * Custom — custom endpoint (hand-implement).
     *
     * @param  string  $conversation           Path parameter — conversation.
     *
     * @return mixed
     */
    public function messages(string $conversation): mixed
    {
        return $this->connector->send(new MessagesMessageRequest($conversation))->dto();
    }


    /**
     * Custom — custom endpoint (hand-implement).
     *
     * @param  string  $conversation           Path parameter — conversation.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return mixed
     */
    public function messages(string $conversation, ?string $idempotencyKey = null): mixed
    {
        return $this->connector->send(new MessagesMessageRequest($conversation, $idempotencyKey))->dto();
    }


    /**
     * Update one message.
     *
     * @param  string  $message                Path parameter — message.
     * @param  UpdateMessagePayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return MessageData
     */
    public function update(string $message, \Academorix\NotificationsMessagingSdk\Payloads\Messages\UpdateMessagePayload $payload, ?string $idempotencyKey = null): MessageData
    {
        return $this->connector->send(new UpdateMessageRequest($message, $payload, $idempotencyKey))->dto();
    }
}
