<?php

declare(strict_types=1);

namespace Stackra\PlatformCredentialsSdk\Enums;

/**
 * Wire-visible backed enum for `credential.holder_type`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category CredentialsSdk
 *
 * @since    0.1.0
 */
enum CredentialHolderType: string
{
    case Athletes = 'athletes';
    case Staff = 'staff';
}
