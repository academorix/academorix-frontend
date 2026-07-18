<?php

declare(strict_types=1);

/**
 * Nightwatch Redactor Attribute.
 *
 * Mark a class as a Nightwatch redactor for automatic discovery and
 * registration. Redactors modify captured data to remove or obfuscate
 * sensitive information before it is sent to Nightwatch.
 *
 * @category Attributes
 *
 * @since    1.0.0
 *
 * @see \Academorix\Nightwatch\Contracts\NightwatchRedactor
 * @see \Academorix\Nightwatch\Compiler\NightwatchCompiler
 */

namespace Academorix\Nightwatch\Attributes;

use Attribute;
use Academorix\Nightwatch\Enums\NightwatchEventType;

/**
 * Nightwatch Redactor Attribute.
 *
 * Mark a class as a Nightwatch redactor for automatic discovery and registration.
 * Redactors modify captured data to remove or obfuscate sensitive information
 * before it is sent to Nightwatch.
 *
 * ## Usage:
 *
 * ```php
 * #[AsNightwatchRedactor(NightwatchEventType::Request)]
 * class IpRedactor implements NightwatchRedactor
 * {
 *     public function redact(mixed $record): void
 *     {
 *         $record->ip = preg_replace('/\d+$/', '***', $record->ip);
 *     }
 * }
 * ```
 *
 * @see \Academorix\Nightwatch\Contracts\NightwatchRedactor
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsNightwatchRedactor
{
    /**
     * @param NightwatchEventType $eventType   The event type this redactor applies to
     * @param string|null         $description Optional description
     */
    public function __construct(
        public NightwatchEventType $eventType,
        public ?string $description = null,
    ) {}
}
