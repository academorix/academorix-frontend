<?php

declare(strict_types=1);

namespace Academorix\NotificationsMessagingSdk;

use Academorix\ApiSdk\Attributes\AsSdkResource;
use Academorix\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `messaging` module.
 *
 * Registered under `#[AsSdkResource(name: 'messaging', service: 'notifications')]`
 * so the Notifications service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->messaging()->...`.
 *
 * ## Peer Resources
 *
 * - ConversationParticipantsResource — peer resource for `conversation-participants`.
 * - ConversationsResource — peer resource for `conversations`.
 * - MessagesResource — peer resource for `messages`.
 *
 * @category MessagingSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'messaging', service: 'notifications')]
final class MessagingSdkResource extends BaseSdkResource
{
    private ?Resources\ConversationParticipantsResource $conversationParticipants = null;
    private ?Resources\ConversationsResource $conversations = null;
    private ?Resources\MessagesResource $messages = null;

    /**
     * Access ConversationParticipants peer Resource.
     */
    public function conversationParticipants(): Resources\ConversationParticipantsResource
    {
        return $this->conversationParticipants ??= new Resources\ConversationParticipantsResource($this->connector);
    }

    /**
     * Access Conversations peer Resource.
     */
    public function conversations(): Resources\ConversationsResource
    {
        return $this->conversations ??= new Resources\ConversationsResource($this->connector);
    }

    /**
     * Access Messages peer Resource.
     */
    public function messages(): Resources\MessagesResource
    {
        return $this->messages ??= new Resources\MessagesResource($this->connector);
    }
}
