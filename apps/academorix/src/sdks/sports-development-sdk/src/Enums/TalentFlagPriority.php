<?php

declare(strict_types=1);

namespace Stackra\SportsDevelopmentSdk\Enums;

/**
 * Wire-visible backed enum for `talent-flag.priority`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category DevelopmentSdk
 *
 * @since    0.1.0
 */
enum TalentFlagPriority: string
{
    case Low = 'low';
    case Medium = 'medium';
    case High = 'high';
    case Critical = 'critical';
}
