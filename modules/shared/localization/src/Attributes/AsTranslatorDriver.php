<?php

declare(strict_types=1);

namespace Academorix\Localization\Attributes;

use Attribute;

/**
 * Register a class as a machine-translation driver.
 *
 * Discovered at boot by the framework's generic hydration pump
 * ({@see \Academorix\ServiceProvider\Bootstrappers\HydrationBootstrapper})
 * via the `#[HydratesFrom]` declaration on
 * {@see \Academorix\Localization\Contracts\Services\TranslatorDriverRegistryInterface::register()}.
 * Every class carrying this attribute lands in the registry and is
 * resolvable through
 * {@see \Academorix\Localization\Services\TranslatorDriverManager}
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
