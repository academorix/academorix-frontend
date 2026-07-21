<?php

declare(strict_types=1);

namespace Stackra\SportsProgressSdk\Enums;

/**
 * Wire-visible backed enum for `coach-note.visibility`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category ProgressSdk
 *
 * @since    0.1.0
 */
enum CoachNoteVisibility: string
{
    case CoachOnly = 'coach_only';
    case SharedWithParent = 'shared_with_parent';
    case SharedWithAthlete = 'shared_with_athlete';
    case SharedWithBoth = 'shared_with_both';
}
