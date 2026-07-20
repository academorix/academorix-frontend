<?php

declare(strict_types=1);

namespace Academorix\Localization\Services;

use Academorix\Localization\Contracts\Repositories\PlatformLanguageRepositoryInterface;
use Academorix\Localization\Contracts\Repositories\TranslationRepositoryInterface;
use Academorix\Localization\Contracts\Services\TranslationCacheInterface;
use Academorix\Localization\Contracts\Data\PlatformLanguageInterface;
use Academorix\Localization\Contracts\Data\TranslationInterface;
use Academorix\Localization\Events\TranslationCacheHit;
use Academorix\Localization\Events\TranslationCacheMiss;
use Academorix\Localization\Models\Translation;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Translation\Translator;

/**
 * Extends Laravel's `Translator` and overrides `get()` + `choice()`
 * to consult the DB cache before the filesystem lookup.
 *
 * Resolution chain:
 *   1. Cache (Redis / array) — hit returns immediately.
 *   2. `Translation` table by `(tenant_id, locale, namespace, group, key)` — tenant override.
 *   3. `Translation` table by `(NULL, locale, namespace, group, key)` — platform default.
 *   4. Parent `get()` — file-based `lang/{locale}/{group}.php` / JSON.
 *
 * NOT bound as `#[Singleton]` — Laravel's own Translator binds as a
 * singleton via the framework's translation service provider. Our
 * subclass inherits that lifetime when the localization service
 * provider swaps the `translator` container key.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class CachedTranslator extends Translator
{
    /**
     * The per-request active tenant id — populated by the
     * ResolveLocale middleware. Nullable because platform-plane
     * routes (unauthenticated marketing pages) resolve without a
     * tenant.
     */
    private ?string $activeTenantId = null;

    /**
     * @param  TranslationRepositoryInterface        $translations  Persistence boundary.
     * @param  TranslationCacheInterface             $cache         Read-through cache.
     * @param  PlatformLanguageRepositoryInterface   $languages     For locale → language_id lookup.
     * @param  Dispatcher                            $events        Event dispatcher for telemetry.
     * @param  float                                 $sampleRatio   Fraction of hits that fire the event.
     * @param  \Illuminate\Contracts\Translation\Loader  $loader     Passed through to parent.
     * @param  string                                $locale        Passed through to parent.
     */
    public function __construct(
        private readonly TranslationRepositoryInterface $translations,
        private readonly TranslationCacheInterface $cache,
        private readonly PlatformLanguageRepositoryInterface $languages,
        private readonly Dispatcher $events,
        private readonly float $sampleRatio,
        \Illuminate\Contracts\Translation\Loader $loader,
        string $locale,
    ) {
        parent::__construct($loader, $locale);
    }

    /**
     * Bind the active tenant id for the current request. Called by
     * `ResolveLocaleMiddleware` before the request body executes.
     */
    public function setActiveTenantId(?string $tenantId): void
    {
        $this->activeTenantId = $tenantId;
    }

    /**
     * {@inheritDoc}
     *
     * Consult the DB cache first; fall through to the parent's
     * file lookup on miss.
     */
    public function get($key, array $replace = [], $locale = null, $fallback = true): string|array
    {
        $localeCode = (string) ($locale ?? $this->locale());
        [$namespace, $group, $item] = $this->parseKey($key);

        // Skip DB for keys that carry no group — Laravel's JSON
        // shortcut (`__('Hello, :name')`) takes this branch and the
        // file lookup owns it.
        if ($item === '' || $group === '') {
            return parent::get($key, $replace, $locale, $fallback);
        }

        $cacheHit = $this->cache->get(
            $this->activeTenantId,
            $localeCode,
            $namespace,
            $group,
            $item,
        );

        if ($cacheHit !== null) {
            $this->fireCacheHitEvent($namespace, $group, $item, $localeCode, 'redis_cache');

            return $this->applyPlaceholders($cacheHit, $replace);
        }

        // Cache miss — look up the DB. Try tenant override first.
        $row = $this->translations->findResolved(
            $this->activeTenantId,
            $localeCode,
            $namespace,
            $group,
            $item,
        );

        // Fall back to platform-default row when the tenant lookup
        // missed but the caller IS operating under a tenant.
        if ($row === null && $this->activeTenantId !== null) {
            $row = $this->translations->findResolved(
                null,
                $localeCode,
                $namespace,
                $group,
                $item,
            );
        }

        if ($row instanceof Translation) {
            $value = (string) $row->{TranslationInterface::ATTR_VALUE};

            $this->cache->put(
                $this->activeTenantId,
                $localeCode,
                $namespace,
                $group,
                $item,
                $value,
            );

            $this->fireCacheHitEvent(
                $namespace,
                $group,
                $item,
                $localeCode,
                $this->activeTenantId === null ? 'platform_default' : 'tenant_override',
            );

            return $this->applyPlaceholders($value, $replace);
        }

        // Every DB tier missed — hand off to parent (file-based
        // lookup). Emit the miss event so consumers can trigger
        // auto-translate.
        $this->events->dispatch(new TranslationCacheMiss(
            tenantId: $this->activeTenantId,
            namespace: $namespace,
            group: $group,
            key: $item,
            localeCode: $localeCode,
        ));

        return parent::get($key, $replace, $locale, $fallback);
    }

    /**
     * Parse a Laravel translation key into `[namespace, group, item]`.
     *
     * @return array{0:string,1:string,2:string}
     */
    private function parseKey(string $key): array
    {
        // Laravel keys are either `namespace::group.item` or
        // `group.item` (no namespace).
        [$namespace, $rest] = \str_contains($key, '::')
            ? \explode('::', $key, 2)
            : [TranslationInterface::NAMESPACE_DEFAULT, $key];

        [$group, $item] = \str_contains($rest, '.')
            ? \explode('.', $rest, 2)
            : [$rest, ''];

        return [$namespace, $group, $item];
    }

    /**
     * Fire the sampled cache-hit event. `sampleRatio=1.0` fires every
     * hit; `0.0` fires none.
     */
    private function fireCacheHitEvent(
        string $namespace,
        string $group,
        string $key,
        string $localeCode,
        string $source,
    ): void {
        if ($this->sampleRatio <= 0.0) {
            return;
        }

        if ($this->sampleRatio < 1.0 && \mt_rand() / \mt_getrandmax() > $this->sampleRatio) {
            return;
        }

        $this->events->dispatch(new TranslationCacheHit(
            namespace: $namespace,
            group: $group,
            key: $key,
            localeCode: $localeCode,
            source: $source,
        ));
    }

    /**
     * Apply `:placeholder` substitutions the same way Laravel's
     * parent Translator does. Called for cached values so consumers
     * see the same interpolation semantics regardless of source
     * tier.
     *
     * @param  array<string, mixed>  $replace
     */
    private function applyPlaceholders(string $value, array $replace): string
    {
        if ($replace === []) {
            return $value;
        }

        // Delegate to parent's placeholder implementation to keep
        // behaviour identical.
        return $this->makeReplacements($value, $replace);
    }
}
