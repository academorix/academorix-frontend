<?php

declare(strict_types=1);

namespace Academorix\PlatformSafeguardingSdk\Enums;

/**
 * Wire-visible backed enum for `background-check.check_type`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category SafeguardingSdk
 *
 * @since    0.1.0
 */
enum BackgroundCheckCheckType: string
{
    case DbsEnhanced = 'dbs_enhanced';
    case DbsBasic = 'dbs_basic';
    case StateBci = 'state_bci';
    case Safesport = 'safesport';
    case Custom = 'custom';
}
