<?php

declare(strict_types=1);

namespace App\Nightwatch\Redactors;

use Academorix\Nightwatch\Attributes\AsNightwatchRedactor;
use Academorix\Nightwatch\Contracts\NightwatchRedactor;
use Academorix\Nightwatch\Enums\NightwatchEventType;

/**
 * Example: IP Redactor.
 *
 * Redacts the last octet of IP addresses in request records
 * for privacy compliance.
 */
#[AsNightwatchRedactor(NightwatchEventType::Request, description: 'Redacts IP last octet')]
class IpRedactor implements NightwatchRedactor
{
    public function redact(mixed $record): void
    {
        $record->ip = preg_replace('/\d+$/', '***', $record->ip);
    }
}
