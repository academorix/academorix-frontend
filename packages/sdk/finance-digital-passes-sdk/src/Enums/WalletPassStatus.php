<?php

declare(strict_types=1);

namespace Academorix\FinanceDigitalPassesSdk\Enums;

/**
 * Wire-visible backed enum for `wallet-pass.status`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category DigitalPassesSdk
 *
 * @since    0.1.0
 */
enum WalletPassStatus: string
{
    case Issued = 'issued';
    case Installed = 'installed';
    case Updated = 'updated';
    case Revoked = 'revoked';
    case Expired = 'expired';
}
