<?php

declare(strict_types=1);

namespace Stackra\SportsProgressSdk\Enums;

/**
 * Wire-visible backed enum for `progress-assessment.overall_tier`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category ProgressSdk
 *
 * @since    0.1.0
 */
enum ProgressAssessmentOverallTier: string
{
    case Bronze = 'bronze';
    case Silver = 'silver';
    case Gold = 'gold';
    case Diamond = 'diamond';
}
