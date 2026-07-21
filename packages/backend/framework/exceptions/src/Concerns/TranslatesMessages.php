<?php

/**
 * @file packages/exceptions/src/Concerns/TranslatesMessages.php
 *
 * @description
 * Trait that hangs off {@see \Stackra\Exceptions\Exception}
 * to give every exception a translation pipeline for its user-facing
 * message. The trait is opt-in per exception (via the base class) so
 * exceptions that never see a client don't pay for a translator
 * lookup they can't use.
 *
 * ## The lookup order
 *
 * `userMessage()` resolves in this priority (first non-null wins):
 *
 *   1. An explicit `withUserMessage('...')` set by the caller.
 *   2. `trans($this->translationKey(), $this->translationParameters())`
 *      when the resolved key differs from the input key (i.e., a
 *      translation actually exists in the loaded lang bundle).
 *   3. `$this->userMessage` — the class-level default (usually
 *      declared as a `protected ?string $userMessage = '...';`).
 *   4. `null` — the renderer falls back to a generic "something went
 *      wrong" from the envelope layer.
 *
 * ## Registering translations
 *
 * The exceptions package publishes `lang/en/{auth,http,domain,
 * infrastructure,generic}.php` under the `exceptions::` namespace.
 * Apps override individual strings by placing files at
 * `lang/vendor/exceptions/<locale>/<file>.php` and running
 * `php artisan lang:publish`.
 *
 * Every concrete subclass declares:
 *
 *   public const TRANSLATION_KEY = 'exceptions::auth.forbidden';
 *
 * Static factories may override the key + parameters per call:
 *
 *   return static::make()
 *       ->withTranslationKey('exceptions::auth.forbidden.missing_permission')
 *       ->withTranslationParameters(['permission' => $permission]);
 */

declare(strict_types=1);

namespace Stackra\Exceptions\Concerns;

trait TranslatesMessages
{
    /**
     * When set, overrides the class-level `TRANSLATION_KEY` constant.
     * Used by static factories that want to point at a more specific
     * key ("missing_permission" vs. the class default "forbidden").
     */
    protected ?string $translationKey = null;

    /**
     * Placeholders passed to the translator. Keys follow Laravel's
     * `:placeholder` convention.
     *
     * @var array<string, scalar|\Stringable>
     */
    protected array $translationParameters = [];

    /**
     * Locale override — when null, uses the app's active locale.
     */
    protected ?string $translationLocale = null;

    /**
     * The translation key this exception resolves. Prefers the
     * per-instance override, then the class constant.
     */
    public function translationKey(): ?string
    {
        if ($this->translationKey !== null && $this->translationKey !== '') {
            return $this->translationKey;
        }

        // Every concrete subclass declares TRANSLATION_KEY. The base
        // class also declares it (as the generic fallback) so
        // `static::TRANSLATION_KEY` is always safe to read.
        $constant = defined(static::class . '::TRANSLATION_KEY') ? static::TRANSLATION_KEY : '';

        return is_string($constant) && $constant !== '' ? $constant : null;
    }

    /**
     * Placeholders passed to the translator when resolving
     * {@see translationKey()}. Merged over the constructor defaults.
     *
     * @return array<string, scalar|\Stringable>
     */
    public function translationParameters(): array
    {
        return $this->translationParameters;
    }

    /**
     * Locale override, or `null` when we should use the app locale.
     */
    public function translationLocale(): ?string
    {
        return $this->translationLocale;
    }

    /**
     * Explicit key override — usually called from a static factory
     * to point at a more specific translation than the class default.
     */
    public function withTranslationKey(?string $key): static
    {
        $this->translationKey = $key;

        return $this;
    }

    /**
     * Merge additional placeholders into the translation parameters.
     *
     * @param array<string, scalar|\Stringable> $parameters
     */
    public function withTranslationParameters(array $parameters): static
    {
        $this->translationParameters = array_replace($this->translationParameters, $parameters);

        return $this;
    }

    public function withTranslationLocale(?string $locale): static
    {
        $this->translationLocale = $locale;

        return $this;
    }

    /**
     * Run the current translation key through Laravel's translator.
     *
     * Returns `null` when there is no key, when Laravel isn't
     * booted (unit tests without the container), or when the
     * translator returned the key unchanged (i.e., no matching
     * translation is loaded — the safety net that keeps us from
     * shipping raw `exceptions::foo.bar` strings to clients).
     */
    protected function resolveTranslatedMessage(): ?string
    {
        $key = $this->translationKey();

        if ($key === null) {
            return null;
        }

        if (! function_exists('trans')) {
            return null;
        }

        /** @var string $translated */
        $translated = (string) trans(
            $key,
            $this->translationParameters,
            $this->translationLocale,
        );

        // `trans()` returns the key back verbatim when it can't
        // find a match — treat that as "no translation" so the
        // renderer falls back to the class default.
        if ($translated === $key) {
            return null;
        }

        return $translated;
    }
}
