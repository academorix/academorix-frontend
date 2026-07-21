<?php

declare(strict_types=1);

namespace Stackra\PlatformAiSdk\Enums;

/**
 * Wire-visible backed enum for `ai-tool-call.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category AiSdk
 *
 * @since    0.1.0
 */
enum AiToolCallStatus: string
{
    case Running = 'running';
    case Completed = 'completed';
    case Failed = 'failed';
    case Refused = 'refused';
}
