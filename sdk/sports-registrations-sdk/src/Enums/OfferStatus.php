<?php

declare(strict_types=1);

namespace Academorix\SportsRegistrationsSdk\Enums;

/**
 * Wire-visible backed enum for `offer.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category RegistrationsSdk
 *
 * @since    0.1.0
 */
enum OfferStatus: string
{
    case Open = 'open';
    case Accepted = 'accepted';
    case Declined = 'declined';
    case Expired = 'expired';
    case Withdrawn = 'withdrawn';
}
