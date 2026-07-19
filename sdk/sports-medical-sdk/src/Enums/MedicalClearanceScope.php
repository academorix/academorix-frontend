<?php

declare(strict_types=1);

namespace Academorix\SportsMedicalSdk\Enums;

/**
 * Wire-visible backed enum for `medical-clearance.scope`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category MedicalSdk
 *
 * @since    0.1.0
 */
enum MedicalClearanceScope: string
{
    case AllActivities = 'all_activities';
    case Limited = 'limited';
    case PendingReview = 'pending_review';
}
