<?php

declare(strict_types=1);

namespace Academorix\NotificationsMessagingSdk\Enums;

/**
 * Wire-visible backed enum for `conversation-participant.role`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category MessagingSdk
 *
 * @since    0.1.0
 */
enum ConversationParticipantRole: string
{
    case Member = 'member';
    case Admin = 'admin';
    case Observer = 'observer';
}
