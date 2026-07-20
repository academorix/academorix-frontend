<?php

declare(strict_types=1);

namespace Academorix\IdentityPeopleSdk\Enums;

/**
 * Wire-visible backed enum for `tenant-link-request.purpose`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category PeopleSdk
 *
 * @since    0.1.0
 */
enum TenantLinkRequestPurpose: string
{
    case EnrollAthlete = 'enroll_athlete';
    case HireStaff = 'hire_staff';
    case RegisterGuardian = 'register_guardian';
}
