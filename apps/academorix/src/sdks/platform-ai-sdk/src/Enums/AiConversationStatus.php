<?php

declare(strict_types=1);

namespace Stackra\PlatformAiSdk\Enums;

/**
 * Wire-visible backed enum for `ai-conversation.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category AiSdk
 *
 * @since    0.1.0
 */
enum AiConversationStatus: string
{
    case Active = 'active';
    case Archived = 'archived';
    case Flagged = 'flagged';
    case Deleted = 'deleted';
}
