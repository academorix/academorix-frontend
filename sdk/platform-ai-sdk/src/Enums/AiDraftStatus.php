<?php

declare(strict_types=1);

namespace Academorix\PlatformAiSdk\Enums;

/**
 * Wire-visible backed enum for `ai-draft.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category AiSdk
 *
 * @since    0.1.0
 */
enum AiDraftStatus: string
{
    case Open = 'open';
    case Confirmed = 'confirmed';
    case Expired = 'expired';
    case Discarded = 'discarded';
}
