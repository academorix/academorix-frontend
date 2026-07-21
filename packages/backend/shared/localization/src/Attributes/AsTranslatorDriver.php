<?php

declare(strict_types=1);

namespace Stackra\Localization\Attributes;

use Attribute;

/**
 * Register a class as a machine-translation driver.
 *
 * Discovered at boot by the framework's generic hydration pump
 * ({@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper})
 * via the `#[HydratesFrom]` declaration on
 * {@see \Stackra\Localization\Contracts\Services\TranslatorDriverRegistryInterface::register()}.
 * Every class carrying this attribute lands in the registry and is
 * resolvable through
 * {@see \Stackra\Localization\Services\TranslatorDriverManager}
 * via the `name` key.
 *
 * ## Example
 *
 * ```php
 * #[AsTranslatorDriver('openai')]
 * final class OpenAITranslatorDriver implements TranslatorDriverInterface
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
final readonly class AsTranslatorDriver
{
    /**
     * @param  string  $name  Driver identifier — matches the config
     *                        key `config('localization.drivers.<name>.*')`
     *                        AND the string a tenant stores on
     *                        `TenantLocale.auto_translate_driver`.
     */
    public function __construct(
        public string $name,
    ) {
    }
}
