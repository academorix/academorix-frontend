<?php

declare(strict_types=1);

namespace Academorix\NotificationsMessagingSdk\Resources;

use Academorix\ApiSdk\Client\ApiConnector;
use Academorix\ApiSdk\Data\PaginatedResponse;
use Academorix\NotificationsMessagingSdk\Data\ConversationData;
use Academorix\NotificationsMessagingSdk\Requests\Conversations\CreateConversationRequest;
use Academorix\NotificationsMessagingSdk\Requests\Conversations\ListConversationsRequest;
use Academorix\NotificationsMessagingSdk\Requests\Conversations\ShowConversationRequest;
use Academorix\NotificationsMessagingSdk\Requests\Conversations\UpdateConversationRequest;
use Saloon\Http\Response;

/**
 * Peer Resource for the `conversations` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/Conversations/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category MessagingSdk
 *
 * @since    0.1.0
 */
final readonly class ConversationsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }


    /**
     * List every conversation.
     *
     * @param  int|null  $page             1-indexed page.
     * @param  int|null  $perPage          Items per page.
     *
     * @return PaginatedResponse<ConversationData>
     */
    public function list(?int $page = null, ?int $perPage = null): PaginatedResponse
    {
        return $this->connector->send(new ListConversationsRequest($page, $perPage))->dto();
    }


    /**
     * Create a conversation.
     *
     * @param  CreateConversationPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return ConversationData
     */
    public function create(\Academorix\NotificationsMessagingSdk\Payloads\Conversations\CreateConversationPayload $payload, ?string $idempotencyKey = null): ConversationData
    {
        return $this->connector->send(new CreateConversationRequest($payload, $idempotencyKey))->dto();
    }


    /**
     * Show one conversation.
     *
     * @param  string  $conversation           Path parameter — conversation.
     *
     * @return ConversationData
     */
    public function show(string $conversation): ConversationData
    {
        return $this->connector->send(new ShowConversationRequest($conversation))->dto();
    }


    /**
     * Update one conversation.
     *
     * @param  string  $conversation           Path parameter — conversation.
     * @param  UpdateConversationPayload  $payload  The write payload.
     * @param  string|null  $idempotencyKey  Optional idempotency token.
     *
     * @return ConversationData
     */
    public function update(string $conversation, \Academorix\NotificationsMessagingSdk\Payloads\Conversations\UpdateConversationPayload $payload, ?string $idempotencyKey = null): ConversationData
    {
        return $this->connector->send(new UpdateConversationRequest($conversation, $payload, $idempotencyKey))->dto();
    }
}
