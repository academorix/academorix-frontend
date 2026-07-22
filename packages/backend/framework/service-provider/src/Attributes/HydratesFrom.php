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
 * ## Ordering discovered targets by an attribute property
 *
 * Some registries need the `register(...)` calls to arrive in a
 * particular order — e.g. Blueprint macro registrars that must run
 * ascending by their attribute's `priority` field so a downstream
 * macro can compose an upstream one. Declare `sortBy` and the pump
 * sorts targets before calling `register()`.
 *
 * ```php
 * interface BlueprintMacroRegistryInterface
 * {
 *     #[HydratesFrom(AsDatabaseBlueprint::class, sortBy: 'priority')]
 *     public function register(string $className, AsDatabaseBlueprint $attribute): void;
 * }
 * ```
 *
 * Rules:
 *
 *  * `sortBy` names a PUBLIC PROPERTY on the discovered attribute
 *    instance. The property MUST be `int` / `float` / `string`
 *    (values that combine cleanly under the spaceship operator).
 *  * Direction is ASCENDING by construction — lower runs first.
 *    That matches every other priority contract in the framework
 *    ({@see AsBootstrapper::$priority}, {@see \Stackra\ServiceProvider\Attributes\OnBoot::$priority}).
 *    If a domain genuinely needs DESC, invert the value at
 *    attribute-authoring time.
 *  * When `sortBy` is `null` (default) the pump preserves manifest
 *    order — the same order the underlying attribute manifest
 *    (`olvlvl/composer-attribute-collector` output) emits.
 *  * When `sortBy` names a property that doesn't exist on the
 *    attribute, the pump logs a WARNING and falls back to
 *    manifest order rather than failing boot.
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
     *   Execution priority of THIS binding relative to other
     *   `#[HydratesFrom]` declarations — lower runs earlier. Domain
     *   range is 100..199. Lets a downstream registry that depends
     *   on an upstream one's state express the ordering
     *   declaratively.
     *
     * @param  string|null  $sortBy
     *   Optional public-property name on the discovered attribute
     *   instance to sort targets by (ASCENDING) BEFORE calling
     *   `register()`. Leave `null` (default) to preserve manifest
     *   order. See the class docblock for the full contract.
     */
    public function __construct(
        public string $attribute,
        public int $priority = 120,
        public ?string $sortBy = null,
    ) {}
}
