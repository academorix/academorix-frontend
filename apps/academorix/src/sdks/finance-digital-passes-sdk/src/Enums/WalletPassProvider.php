<?php

declare(strict_types=1);

namespace Academorix\FinanceDigitalPassesSdk\Enums;

/**
 * Wire-visible backed enum for `wallet-pass.provider`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category DigitalPassesSdk
 *
 * @since    0.1.0
 */
enum WalletPassProvider: string
{
    case Apple = 'apple';
    case Google = 'google';
    case GenericQr = 'generic_qr';
}
