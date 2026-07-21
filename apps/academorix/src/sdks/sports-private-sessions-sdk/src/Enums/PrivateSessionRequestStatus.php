<?php

declare(strict_types=1);

namespace Stackra\SportsPrivateSessionsSdk\Enums;

/**
 * Wire-visible backed enum for `private-session-request.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category PrivateSessionsSdk
 *
 * @since    0.1.0
 */
enum PrivateSessionRequestStatus: string
{
    case Requested = 'requested';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Scheduled = 'scheduled';
    case Completed = 'completed';
    case NoShow = 'no_show';
    case Cancelled = 'cancelled';
}
