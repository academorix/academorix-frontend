<?php

declare(strict_types=1);

namespace Academorix\SportsSeasonSdk\Enums;

/**
 * Wire-visible backed enum for `season.season_type`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category SeasonSdk
 *
 * @since    0.1.0
 */
enum SeasonSeasonType: string
{
    case Annual = 'annual';
    case AcademicYear = 'academic_year';
    case SummerCamp = 'summer_camp';
    case WinterCamp = 'winter_camp';
    case HalfYear = 'half_year';
    case Quarter = 'quarter';
    case Trimester = 'trimester';
    case Custom = 'custom';
}
