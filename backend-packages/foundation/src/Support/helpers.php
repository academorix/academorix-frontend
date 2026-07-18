<?php

declare(strict_types=1);

/**
 * @file packages/foundation/src/Support/helpers.php
 *
 * @description
 * Global helper functions exposed by `academorix/foundation`. Loaded
 * via `composer.json`'s `autoload.files` entry so every consuming app
 * picks them up automatically.
 *
 * Helpers here should be:
 *   - Small, single-purpose, stateless.
 *   - Namespaced defensively with `function_exists()` guards so an
 *     app that ships its own helper of the same name still boots.
 *   - Documented enough that grepping the codebase reveals every
 *     callsite.
 *
 * Anything larger belongs in a class under `Support/`.
 */

use Academorix\Foundation\Support\CorrelationId;

if (! function_exists('localize_number')) {
    /**
     * Format a number using the currently active locale.
     *
     * Used by the shipped Blade error pages so digit rendering
     * (Latin, Arabic-Indic, ...) follows the request locale instead
     * of being hardcoded to Latin. Falls back to a plain
     * `(string)` cast when the intl extension isn't loaded.
     *
     * @param  int|float  $value   The number to render.
     * @param  string|null $locale Override the current app locale.
     */
    function localize_number(int|float $value, ?string $locale = null): string
    {
        if (! extension_loaded('intl') || ! class_exists(\NumberFormatter::class)) {
            return (string) $value;
        }

        $locale ??= function_exists('app') ? (string) app()->getLocale() : 'en';
        $formatter = new \NumberFormatter($locale, \NumberFormatter::DEFAULT_STYLE);

        return (string) $formatter->format($value);
    }
}

if (! function_exists('correlation_id')) {
    /**
     * Accessor for the current request's correlation id. Thin wrapper
     * around {@see CorrelationId::current()} that keeps Blade
     * templates from having to import the full class path.
     */
    function correlation_id(): ?string
    {
        return CorrelationId::current();
    }
}
