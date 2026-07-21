<?php

declare(strict_types=1);

namespace Stackra\SportsSeasonSdk\Enums;

/**
 * Wire-visible backed enum for `season.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category SeasonSdk
 *
 * @since    0.1.0
 */
enum SeasonStatus: string
{
    case Planned = 'planned';
    case RegistrationOpen = 'registration_open';
    case InProgress = 'in_progress';
    case Playoffs = 'playoffs';
    case Completed = 'completed';
    case Archived = 'archived';
}
