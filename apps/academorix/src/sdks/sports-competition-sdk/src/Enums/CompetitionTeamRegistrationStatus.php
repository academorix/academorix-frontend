<?php

declare(strict_types=1);

namespace Stackra\SportsCompetitionSdk\Enums;

/**
 * Wire-visible backed enum for `competition-team.registration_status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category CompetitionSdk
 *
 * @since    0.1.0
 */
enum CompetitionTeamRegistrationStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Withdrew = 'withdrew';
    case Disqualified = 'disqualified';
}
