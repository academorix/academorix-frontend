<?php

declare(strict_types=1);

/**
 * Nightwatch Context Attribute.
 *
 * Mark a class as a Nightwatch context provider for automatic discovery
 * and registration. Classes marked with this attribute will be discovered
 * by the NightwatchCompiler and their context data will be added to
 * Nightwatch via Laravel Context.
 *
 * @category Attributes
 *
 * @since    1.0.0
 *
 * @see \Academorix\Nightwatch\Contracts\NightwatchContext
 * @see \Academorix\Nightwatch\Compiler\NightwatchCompiler
 */

namespace Academorix\Nightwatch\Attributes;

use Attribute;

/**
 * Nightwatch Context Attribute.
 *
 * Mark a class as a Nightwatch context provider for automatic discovery
 * and registration. Classes marked with this attribute will be discovered
 * and their context data will be added to Nightwatch via Laravel Context.
 *
 * ## Usage:
 *
 * ```php
 * #[AsNightwatchContext]
 * class TenantContext implements NightwatchContext
 * {
 *     public function key(): string
 *     {
 *         return 'tenant';
 *     }
 *
 *     public function data(): array
 *     {
 *         return [
 *             'id' => tenant()->id,
 *             'name' => tenant()->name,
 *             'plan' => tenant()->subscription_plan,
 *         ];
 *     }
 *
 *     public function priority(): int
 *     {
 *         return 100;
 *     }
 * }
 * ```
 *
 * The service provider wraps each provider's output with `Context::add($key, $data)`.
 *
 * @see \Academorix\Nightwatch\Contracts\NightwatchContext
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsNightwatchContext
{
    /**
     * @param string|null $description Optional description of what this context provides
     */
    public function __construct(
        public ?string $description = null,
    ) {}
}
