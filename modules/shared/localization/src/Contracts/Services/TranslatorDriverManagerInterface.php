<?php

declare(strict_types=1);

namespace Academorix\Localization\Contracts\Services;

use Academorix\Localization\Services\TranslatorDriverManager;
use Illuminate\Container\Attributes\Bind;

/**
 * Public API over
 * {@see \Illuminate\Support\Manager}-style driver switching for
 * translator drivers. Resolves the active driver per-tenant via
 * `TenantLocale.auto_translate_driver` or falls back to
 * `config('localization.default_driver')`.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Bind(TranslatorDriverManager::class)]
interface TranslatorDriverManagerInterface
{
    /**
     * Resolve a driver by name — or the default when null.
     *
     * @param  string|null  $name  Driver identifier or null for default.
     */
    public function driver(?string $name = null): TranslatorDriverInterface;

    /**
     * The driver name the manager resolves when no name is passed.
     */
    public function getDefaultDriver(): string;
}
