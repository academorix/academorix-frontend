<?php

declare(strict_types=1);

namespace Stackra\SportsCompetitionSdk\Enums;

/**
 * Wire-visible backed enum for `competition.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category CompetitionSdk
 *
 * @since    0.1.0
 */
enum CompetitionStatus: string
{
    case Draft = 'draft';
    case Registration = 'registration';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}
