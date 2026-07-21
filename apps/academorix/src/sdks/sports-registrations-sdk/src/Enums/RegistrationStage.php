<?php

declare(strict_types=1);

namespace Stackra\SportsRegistrationsSdk\Enums;

/**
 * Wire-visible backed enum for `registration.stage`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category RegistrationsSdk
 *
 * @since    0.1.0
 */
enum RegistrationStage: string
{
    case Lead = 'lead';
    case Contacted = 'contacted';
    case Trial = 'trial';
    case Waitlisted = 'waitlisted';
    case Offered = 'offered';
    case Enrolled = 'enrolled';
    case Declined = 'declined';
    case Expired = 'expired';
}
