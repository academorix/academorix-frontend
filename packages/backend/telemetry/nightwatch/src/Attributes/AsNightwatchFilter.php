<?php

declare(strict_types=1);

/**
 * Nightwatch Filter Attribute.
 *
 * Mark a class as a Nightwatch filter for automatic discovery and
 * registration. Filters exclude specific events from Nightwatch
 * collection after sampling.
 *
 * @category Attributes
 *
 * @since    1.0.0
 *
 * @see \Stackra\Nightwatch\Contracts\NightwatchFilter
 * @see \Stackra\Nightwatch\Compiler\NightwatchCompiler
 */

namespace Stackra\Nightwatch\Attributes;

use Attribute;
use Stackra\Nightwatch\Enums\NightwatchEventType;

/**
 * Nightwatch Filter Attribute.
 *
 * Mark a class as a Nightwatch filter for automatic discovery and registration.
 * Filters exclude specific events from Nightwatch collection after sampling.
 *
 * ## Usage:
 *
 * ```php
 * #[AsNightwatchFilter(NightwatchEventType::Query)]
 * class CacheQueryFilter implements NightwatchFilter
 * {
 *     public function reject(mixed $record): bool
 *     {
 *         return str_contains($record->sql, 'from `cache`');
 *     }
 * }
 * ```
 *
 * @see \Stackra\Nightwatch\Contracts\NightwatchFilter
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsNightwatchFilter
{
    /**
     * @param NightwatchEventType $eventType  The event type this filter applies to
     * @param string|null         $description Optional description
     */
    public function __construct(
        public NightwatchEventType $eventType,
        public ?string $description = null,
    ) {}
}
