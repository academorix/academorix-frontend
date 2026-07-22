<?php

declare(strict_types=1);

namespace Stackra\Localization\Services;

use Stackra\Localization\Contracts\Services\TranslatorDriverInterface;
use Stackra\Localization\Contracts\Services\TranslatorDriverManagerInterface;
use Stackra\Localization\Contracts\Registry\TranslatorDriverRegistryInterface;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Scoped;

/**
 * Public API over {@see TranslatorDriverRegistryInterface}.
 *
 * Resolves the active driver per-request: caller passes a name,
 * falls through to `config('localization.default_driver')` when
 * omitted. `#[Scoped]` because per-request tenant overrides on
 * `TenantLocale.auto_translate_driver` change the effective default.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Scoped]
final class TranslatorDriverManager implements TranslatorDriverManagerInterface
{
    /**
     * @param  TranslatorDriverRegistryInterface  $registry  Driver catalogue.
     * @param  string                             $defaultDriver  Fallback name.
     */
    public function __construct(
        private readonly TranslatorDriverRegistryInterface $registry,
        #[Config('localization.default_driver', 'null')] private readonly string $defaultDriver,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function driver(?string $name = null): TranslatorDriverInterface
    {
        $key = $name ?? $this->defaultDriver;

        if (! $this->registry->has($key)) {
            // Fail-soft — resolve the null driver rather than raising.
            // A misconfigured driver name at boot shouldn't crash the
            // whole application; the null driver returns source
            // strings unchanged so the caller degrades gracefully.
            $key = 'null';
        }

        return $this->registry->resolve($key);
    }

    /**
     * {@inheritDoc}
     */
    public function getDefaultDriver(): string
    {
        return $this->defaultDriver;
    }
}
