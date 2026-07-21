<?php

declare(strict_types=1);

namespace Stackra\Localization\Concerns;

/**
 * Lightweight trait for services + view composers that need to
 * read the current locale + fallback chain without full
 * `HasTranslations` semantics.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
trait IsLocaleAware
{
    /**
     * The active locale — whatever `App::getLocale()` returns for
     * the current request.
     */
    public function currentLocale(): string
    {
        return (string) \app()->getLocale();
    }

    /**
     * The fallback locale — `config('localization.fallback_locale')`.
     */
    public function fallbackLocale(): string
    {
        return (string) \config('localization.fallback_locale', 'en');
    }

    /**
     * Run a closure with a specific locale set, restoring the
     * previous locale on exit (including on exception).
     *
     * @template T
     *
     * @param  string        $locale  BCP-47 tag.
     * @param  \Closure(): T  $fn      Closure to run.
     * @return T
     */
    public function withLocale(string $locale, \Closure $fn): mixed
    {
        $previous = \app()->getLocale();

        \app()->setLocale($locale);

        try {
            return $fn();
        } finally {
            \app()->setLocale($previous);
        }
    }
}
