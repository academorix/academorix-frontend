<?php

declare(strict_types=1);

namespace Stackra\NotificationsMessagingSdk\Resources;

use Stackra\ApiSdk\Client\ApiConnector;
use Stackra\ApiSdk\Data\PaginatedResponse;
use Stackra\NotificationsMessagingSdk\Data\ConversationParticipantData;
use Saloon\Http\Response;

/**
 * Peer Resource for the `conversation-participants` aggregate.
 *
 * Fluent façade over the Saloon requests under `Requests/ConversationParticipants/`.
 * Every mutation method accepts an optional idempotency key that
 * threads into the `Idempotency-Key` header.
 *
 * @category MessagingSdk
 *
 * @since    0.1.0
 */
final readonly class ConversationParticipantsResource
{
    /**
     * @param  ApiConnector  $connector  The Saloon connector supplied by the umbrella.
     */
    public function __construct(
        private ApiConnector $connector,
    ) {
    }

}
