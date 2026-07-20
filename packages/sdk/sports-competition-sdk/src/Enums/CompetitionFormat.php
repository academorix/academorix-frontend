<?php

declare(strict_types=1);

namespace Academorix\SportsCompetitionSdk\Enums;

/**
 * Wire-visible backed enum for `competition.format`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category CompetitionSdk
 *
 * @since    0.1.0
 */
enum CompetitionFormat: string
{
    case RoundRobin = 'round_robin';
    case SingleElimination = 'single_elimination';
    case DoubleElimination = 'double_elimination';
    case GroupThenKnockout = 'group_then_knockout';
}
