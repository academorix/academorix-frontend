<?php

declare(strict_types=1);

namespace Stackra\PlatformAiSdk\Enums;

/**
 * Wire-visible backed enum for `ai-run.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category AiSdk
 *
 * @since    0.1.0
 */
enum AiRunStatus: string
{
    case Running = 'running';
    case Succeeded = 'succeeded';
    case Failed = 'failed';
    case Cancelled = 'cancelled';
    case RateLimited = 'rate_limited';
}
