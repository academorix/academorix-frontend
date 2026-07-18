<?php

declare(strict_types=1);

/**
 * Sentry Context Attribute.
 *
 * Mark a class as a Sentry context provider for automatic discovery
 * and registration. Classes marked with this attribute will be
 * discovered by the SentryCompiler and tagged for the
 * SentryContextRegistry.
 *
 * @category Attributes
 *
 * @since    1.0.0
 *
 * @see \Academorix\Sentry\Compiler\SentryCompiler
 */

namespace Academorix\Sentry\Attributes;

use Attribute;

/**
 * Sentry Context Attribute.
 *
 * Mark a class as a Sentry context provider for automatic discovery and registration.
 * Classes marked with this attribute will be automatically discovered and registered
 * with the Sentry context registry.
 *
 * ## Usage:
 *
 * ### Basic Context Provider:
 * ```php
 * use Academorix\Sentry\Attributes\AsSentryContext;
 * use Academorix\Sentry\Contracts\SentryContext;
 * use Sentry\State\Scope;
 * use Throwable;
 *
 * #[AsSentryContext]
 * class TenantContext implements SentryContextInterface
 * {
 *     public function provide(Scope $scope, ?Throwable $throwable = null): void
 *     {
 *         if (tenant()) {
 *             $scope->setTag('tenant_id', tenant()->id);
 *             $scope->setContext('tenant', [
 *                 'id' => tenant()->id,
 *                 'name' => tenant()->name,
 *             ]);
 *         }
 *     }
 *
 *     public function priority(): int
 *     {
 *         return 100;
 *     }
 * }
 * ```
 *
 * ### With Priority:
 * ```php
 * #[AsSentryContext]
 * class CriticalContext implements SentryContextInterface
 * {
 *     public function provide(Scope $scope, ?Throwable $throwable = null): void
 *     {
 *         $scope->setTag('critical', 'yes');
 *     }
 *
 *     public function priority(): int
 *     {
 *         return 1000; // Higher priority = runs first
 *     }
 * }
 * ```
 *
 * ## Discovery:
 * Context providers are automatically discovered during application boot
 * using the Discovery facade. No manual registration required!
 *
 * ## Requirements:
 * - Class MUST implement `SentryContextInterface`
 * - Class MUST be in a namespace that's scanned by Discovery
 * - Class MUST implement `provide()` and `priority()` methods
 *
 * @see SentryContextInterface
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsSentryContext
{
    /**
     * Create a new Sentry context attribute.
     *
     * @param string|null $description Optional description of what this context provides
     */
    public function __construct(
        public ?string $description = null,
    ) {}
}
