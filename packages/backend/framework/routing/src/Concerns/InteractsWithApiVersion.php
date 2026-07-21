<?php

/**
 * @file packages/routing/src/Concerns/InteractsWithApiVersion.php
 *
 * @description
 * Controller-side accessors for the API version resolved by
 * {@see \Stackra\Routing\Middleware\DetectApiVersion}. Provides
 * ergonomic helpers on top of the
 * {@see \Stackra\Routing\Support\ApiVersionRegistry} scoped
 * binding so controller code doesn't have to reach into the
 * container manually.
 *
 * ## Trait, not a base class
 *
 * Composed into {@see \Stackra\Routing\Controller} alongside
 * the other `InteractsWith*` traits. Kept a trait (not extension)
 * so services / listeners / jobs can adopt the same helpers
 * without inheriting from the routing base class.
 *
 * ## Under the hood
 *
 * All accessors resolve the {@see ApiVersionRegistry} via
 * `app(...)` on every call rather than caching a reference — the
 * registry is `scoped()` in the container, so caching would
 * capture the wrong instance across requests on the same Octane
 * worker. `app()` is fine here because the container is warmed
 * up long before controller methods run.
 *
 * ## Usage
 *
 * ```php
 * #[ApiVersion(['v1', 'v2'])]
 * class UsersController extends BaseController
 * {
 *     #[Get('/users')]
 *     public function index()
 *     {
 *         if ($this->apiVersionIs('v2')) {
 *             return $this->ok($this->service()->paginateWithMeta());
 *         }
 *
 *         return $this->ok($this->service()->paginate());
 *     }
 * }
 * ```
 *
 * @see \Stackra\Routing\Support\ApiVersionRegistry
 * @see \Stackra\Routing\Services\VersionComparator
 */

declare(strict_types=1);

namespace Stackra\Routing\Concerns;

use Stackra\Routing\Services\VersionComparator;
use Stackra\Routing\Support\ApiVersionRegistry;

/**
 * Controller helpers that expose the resolved API version.
 */
trait InteractsWithApiVersion
{
    /**
     * The version resolved for this request. `null` when the
     * endpoint is version-neutral (or when the middleware wasn't
     * on the route — treat that as neutral for safety).
     */
    protected function apiVersion(): ?string
    {
        return $this->apiVersionRegistry()->version();
    }

    /**
     * Which channel supplied the version (`'header'`, `'query'`,
     * `'accept'`, `'path'`, `'default'`, `'neutral'`, or `null`
     * when the middleware hasn't populated the registry).
     *
     * @return 'header'|'query'|'accept'|'path'|'default'|'neutral'|null
     */
    protected function apiVersionSource(): ?string
    {
        return $this->apiVersionRegistry()->source();
    }

    /**
     * Semantic equality helper — normalises both sides through
     * {@see VersionComparator} so `apiVersionIs('v1')` matches
     * even when the request supplied `v1.0.0`.
     *
     * Returns `false` for neutral endpoints (no version to
     * compare against).
     */
    protected function apiVersionIs(string $expected): bool
    {
        $current = $this->apiVersion();

        if ($current === null) {
            return false;
        }

        return $this->apiVersionComparator()->equals($current, $expected);
    }

    /**
     * `true` when the resolved version is one of the supplied
     * options. Returns `false` for neutral endpoints or an empty
     * `$options` list.
     *
     * @param  list<string>  $options
     */
    protected function apiVersionIn(array $options): bool
    {
        $current = $this->apiVersion();

        if ($current === null || $options === []) {
            return false;
        }

        return $this->apiVersionComparator()->isOneOf($current, $options);
    }

    /**
     * `true` when the resolved version satisfies the supplied
     * constraint (see
     * {@see \Stackra\Routing\Services\VersionComparator::satisfies()}
     * for the DSL). Returns `false` for neutral endpoints.
     */
    protected function apiVersionSatisfies(string $constraint): bool
    {
        $current = $this->apiVersion();

        if ($current === null) {
            return false;
        }

        return $this->apiVersionComparator()->satisfies($current, $constraint);
    }

    /**
     * `true` when the resolved endpoint is flagged deprecated.
     * Useful for controllers that want to short-circuit into
     * a legacy code path or emit a domain-specific warning
     * envelope.
     */
    protected function apiVersionIsDeprecated(): bool
    {
        return $this->apiVersionRegistry()->isDeprecated();
    }

    /**
     * Convenience → the {@see \Stackra\Routing\Attributes\Sunsets}
     * instance in play for the current request, or `null` when
     * nothing was declared.
     */
    protected function apiVersionSunset(): ?\Stackra\Routing\Attributes\Sunsets
    {
        return $this->apiVersionRegistry()->sunsets();
    }

    // -----------------------------------------------------------------
    // Container access helpers — private so consumers can't rely on
    // the container-resolution details.
    // -----------------------------------------------------------------

    /**
     * Resolve the request-scoped registry via the container. Not
     * cached — the registry is `scoped()`, so caching a reference
     * would hold the wrong instance across requests on the same
     * Octane worker.
     */
    private function apiVersionRegistry(): ApiVersionRegistry
    {
        return app(ApiVersionRegistry::class);
    }

    /**
     * Resolve the version comparator via the container. This one
     * IS a singleton, so `app()` returns the same instance every
     * time — but we still route through the container to keep the
     * trait free of concrete-type assumptions.
     */
    private function apiVersionComparator(): VersionComparator
    {
        return app(VersionComparator::class);
    }
}
