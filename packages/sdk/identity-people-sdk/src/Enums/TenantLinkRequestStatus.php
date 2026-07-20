<?php

declare(strict_types=1);

namespace Academorix\IdentityPeopleSdk\Enums;

/**
 * Wire-visible backed enum for `tenant-link-request.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category PeopleSdk
 *
 * @since    0.1.0
 */
enum TenantLinkRequestStatus: string
{
    case Requested = 'requested';
    case Approved = 'approved';
    case Declined = 'declined';
    case Revoked = 'revoked';
    case Expired = 'expired';
}
