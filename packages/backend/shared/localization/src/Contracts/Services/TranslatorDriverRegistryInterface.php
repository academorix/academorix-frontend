<?php

declare(strict_types=1);

namespace Stackra\Localization\Contracts\Services;

use Stackra\Localization\Attributes\AsTranslatorDriver;
use Stackra\Localization\Services\TranslatorDriverRegistry;
use Stackra\ServiceProvider\Attributes\HydratesFrom;
use Illuminate\Container\Attributes\Bind;

/**
 * Registry of every class carrying
 * {@see AsTranslatorDriver}. Hydrated at boot via the
 * `#[HydratesFrom]` declaration on {@see register()}.
 *
 * Consumed by
 * {@see \Stackra\Localization\Services\TranslatorDriverManager}
 * — the manager reaches into the registry to resolve `driver(name)`.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Bind(TranslatorDriverRegistry::class)]
interface TranslatorDriverRegistryInterface
{
    /**
     * Register a driver class.
     *
     * @param  class-string  $className  FQCN of the driver.
     * @param  AsTranslatorDriver  $attribute  Discovered attribute instance.
     */
    #[HydratesFrom(AsTranslatorDriver::class)]
    public function register(string $className, AsTranslatorDriver $attribute): void;

    /**
     * Resolve a driver instance by name.
     *
     * @param  string  $name  Driver identifier.
     * @return TranslatorDriverInterface  The resolved driver.
     */
    public function resolve(string $name): TranslatorDriverInterface;

    /**
     * Whether a driver by that name is registered.
     */
    public function has(string $name): bool;

    /**
     * Every registered driver name.
     *
     * @return list<string>
     */
    public function names(): array;
}
