<?php

declare(strict_types=1);

namespace Academorix\PlatformReceptionSdk\Enums;

/**
 * Wire-visible backed enum for `reception-visit.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category ReceptionSdk
 *
 * @since    0.1.0
 */
enum ReceptionVisitStatus: string
{
    case CheckedIn = 'checked_in';
    case CheckedOut = 'checked_out';
    case AutoCheckedOut = 'auto_checked_out';
    case NoShow = 'no_show';
}
