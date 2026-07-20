<?php

declare(strict_types=1);

namespace Academorix\PlatformCredentialsSdk\Enums;

/**
 * Wire-visible backed enum for `gate.reader_type`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category CredentialsSdk
 *
 * @since    0.1.0
 */
enum GateReaderType: string
{
    case Nfc = 'nfc';
    case Rfid = 'rfid';
    case Qr = 'qr';
    case Hybrid = 'hybrid';
}
