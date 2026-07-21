<?php

declare(strict_types=1);

namespace Stackra\PlatformCredentialsSdk\Enums;

/**
 * Wire-visible backed enum for `credential.kind`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category CredentialsSdk
 *
 * @since    0.1.0
 */
enum CredentialKind: string
{
    case Nfc = 'nfc';
    case Rfid = 'rfid';
    case Qr = 'qr';
    case Wristband = 'wristband';
    case Card = 'card';
}
