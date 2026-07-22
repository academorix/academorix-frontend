<?php

declare(strict_types=1);

/**
 * @file packages/framework/service-provider/src/Attributes/HydratesFrom.php
 *
 * @description
 * Method-level attribute that declares a registry's hydration
 * source: which `#[AsX]` attribute the framework should scan, and
 * which method on the interface receives each discovered target
 * at app boot.
 *
 * Placed on the `register()` method of a registry interface
 * (e.g. {@see \Stackra\Webhook\Contracts\Registry\WebhookRegistryInterface::register()}).
 * At boot the framework's meta-{@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 * scans every method carrying this attribute, resolves the
 * declaring interface from the container, then iterates every
 * class carrying `$attribute` and calls the method with
 * `(class_name, attribute_instance)`.
 *
 * The result: every domain package that ships an `#[AsX]`
 * catalogue skips the "hand-roll one discovery bootstrapper per
 * attribute" step. The interface owns the WHAT-and-HOW (scan X,
 * push to me); the concrete registry owns the WHERE (in-memory
 * map, `Artisan::add()`, `Route::addRoute()`, etc.).
 *
 * @category Bootstrapper
 *
 * @since    0.1.0
 */

namespace Stackra\ServiceProvider\Attributes;

use Attribute;

/**
 * Declare a registry method as the hydration sink for a discovery
 * attribute. Composed with {@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 * to generalise away the "one bootstrapper class per attribute"
 * duplication.
 *
 * `IS_REPEATABLE` so a single method can consume more than one
 * attribute source when the domain semantics call for it (rare —
 * the usual shape is one attribute per registry method).
 *
 * ## Usage
 *
 * ```php
 * interface WebhookRegistryInterface
 * {
 *     #[HydratesFrom(AsWebhookEvent::class)]
 *     public function register(string $className, AsWebhookEvent $attribute): void;
 * }
 * ```
 *
 * @category Bootstrapper
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
final readonly class HydratesFrom
{
    /**
     * @param  class-string  $attribute
     *   The `#[AsX]` attribute class-string the framework scans to
     *   find every target that should be pushed through this
     *   registry method.
     *
     * @param  int  $priority
     *   Execution priority — lower runs earlier. Domain range is
     *   100..199. The generic pump orders hydration passes by this
     *   value so a downstream registry that depends on an
     *   upstream one's state can express the ordering
     *   declaratively.
     */
    public function __construct(
        public string $attribute,
        public int $priority = 120,
    ) {}
}
