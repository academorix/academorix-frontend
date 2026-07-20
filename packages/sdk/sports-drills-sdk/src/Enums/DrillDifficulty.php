<?php

declare(strict_types=1);

namespace Academorix\SportsDrillsSdk\Enums;

/**
 * Wire-visible backed enum for `drill.difficulty`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category DrillsSdk
 *
 * @since    0.1.0
 */
enum DrillDifficulty: string
{
    case Beginner = 'beginner';
    case Intermediate = 'intermediate';
    case Advanced = 'advanced';
    case Expert = 'expert';
}
