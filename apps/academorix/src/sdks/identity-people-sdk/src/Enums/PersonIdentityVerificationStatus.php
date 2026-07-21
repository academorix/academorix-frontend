<?php

declare(strict_types=1);

namespace Stackra\IdentityPeopleSdk\Enums;

/**
 * Wire-visible backed enum for `person-identity.verification_status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category PeopleSdk
 *
 * @since    0.1.0
 */
enum PersonIdentityVerificationStatus: string
{
    case Unverified = 'unverified';
    case Verified = 'verified';
    case Disputed = 'disputed';
    case Frozen = 'frozen';
}
