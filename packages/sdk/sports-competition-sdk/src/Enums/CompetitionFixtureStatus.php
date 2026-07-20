<?php

declare(strict_types=1);

namespace Academorix\SportsCompetitionSdk\Enums;

/**
 * Wire-visible backed enum for `competition-fixture.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category CompetitionSdk
 *
 * @since    0.1.0
 */
enum CompetitionFixtureStatus: string
{
    case Scheduled = 'scheduled';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case Postponed = 'postponed';
}
