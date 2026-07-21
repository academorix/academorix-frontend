<?php

declare(strict_types=1);

/**
 * Nightwatch Redactor Contract.
 *
 * Redactors modify captured data to remove or obfuscate sensitive
 * information before it is sent to Nightwatch.
 *
 * @category Contracts
 *
 * @since    1.0.0
 */

namespace Stackra\Nightwatch\Contracts;

/**
 * Nightwatch Redactor Contract.
 *
 * Redactors modify captured data to remove or obfuscate sensitive
 * information before it is sent to Nightwatch.
 */
interface NightwatchRedactor
{
    /**
     * Redact sensitive information from the event record.
     *
     * Modify the record in-place to remove or obfuscate sensitive data.
     *
     * @param mixed $record The Nightwatch record (Request, Query, Exception, etc.)
     */
    public function redact(mixed $record): void;
}
