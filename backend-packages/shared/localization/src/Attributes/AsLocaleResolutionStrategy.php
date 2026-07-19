<?php

declare(strict_types=1);

namespace Academorix\Localization\Attributes;

use Attribute;

/**
 * Register a class as a locale-resolution strategy.
 *
 * Discovered at boot by the framework's generic hydration pump
 * ({@see \Academorix\ServiceProvider\Bootstrappers\HydrationBootstrapper})
 * via the `#[HydratesFrom]` declaration on
 * {@see \Academorix\Localization\Contracts\Services\LocaleResolutionStrategyRegistryInterface::register()}.
 * The
 * {@see \Academorix\Localization\Services\LocaleResolver} iterates
 * the config-declared chain and asks each named strategy in turn.
 *
 * ## Example
 *
 * ```php
 * #[AsLocaleResolutionStrategy('query')]
 * final class QueryStringStrategy implements LocaleResolutionStrategyInterface
 * {
 *     // ...
 * }
 * ```
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsLocaleResolutionStrategy
{
    /**
     * @param  string  $name  Strategy identifier — matches an entry
     *                        in `config('localization.resolve.chain')`.
     */
    public function __construct(
        public string $name,
    ) {
    }
}
