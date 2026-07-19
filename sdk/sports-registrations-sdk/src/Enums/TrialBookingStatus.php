<?php

declare(strict_types=1);

namespace Academorix\SportsRegistrationsSdk\Enums;

/**
 * Wire-visible backed enum for `trial-booking.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category RegistrationsSdk
 *
 * @since    0.1.0
 */
enum TrialBookingStatus: string
{
    case Booked = 'booked';
    case Attended = 'attended';
    case NoShow = 'no_show';
    case Cancelled = 'cancelled';
}
