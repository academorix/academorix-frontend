<?php

declare(strict_types=1);

namespace Stackra\PlatformCredentialsSdk\Enums;

/**
 * Wire-visible backed enum for `checkin-log.direction`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category CredentialsSdk
 *
 * @since    0.1.0
 */
enum CheckinLogDirection: string
{
    case In = 'in';
    case Out = 'out';
}
