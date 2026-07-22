<?php

declare(strict_types=1);

namespace Stackra\Versioning\Contracts\Registry;

use Stackra\ServiceProvider\Attributes\HydratesFrom;
use Stackra\Versioning\Attributes\AsApiSurface;
use Stackra\Versioning\Models\ApiVersion;
use Stackra\Versioning\Registry\ApiVersionRegistry;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Singleton;

/**
 * In-memory registry mapping version slugs to ApiVersion rows.
 *
 * Two population paths:
 *
 *   - Slug-based via {@see register()} — used by tests, custom
 *     bootstrappers, and static pins that don't ride the discovery
 *     pass.
 *   - Attribute-driven via {@see registerSurface()} — the framework's
 *     generic
 *     {@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 *     scans every class carrying `#[AsApiSurface]` at boot and hands
 *     each hit to `registerSurface()`, which fans out to `register()`
 *     for every version slug the surface declares.
 *
 * Reads short-circuit past the DB — the resolver chain calls
 * `resolve()` every request and can never afford a query.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[Bind(ApiVersionRegistry::class)]
#[Singleton]
interface ApiVersionRegistryInterface
{
    /**
     * Register a version by slug + FQCN of a class that resolves to
     * the {@see ApiVersion} instance (or the instance itself).
     *
     * @param  string  $slug       Human-readable slug (e.g. `v1`).
     * @param  string  $className  FQCN pointing at the ApiVersion source.
     */
    public function register(string $slug, string $className): void;

    /**
     * Register every version slug declared by an `#[AsApiSurface]`
     * carrier.
     *
     * `#[HydratesFrom(AsApiSurface::class)]` — the framework scans
     * every class carrying `#[AsApiSurface]` at boot and calls this
     * method with `(className, attributeInstance)`. The concrete
     * iterates `$attribute->versions` and calls {@see register()}
     * once per slug. This shape exists because the surface attribute
     * is 1:N (one class declares N versions) — hydration needs a
     * seam that fans out.
     *
     * @param  class-string  $className  FQCN of the surface class.
     * @param  AsApiSurface  $attribute  The discovered attribute
     *   instance — carries `name` + `versions`.
     */
    #[HydratesFrom(AsApiSurface::class)]
    public function registerSurface(string $className, AsApiSurface $attribute): void;

    /**
     * Resolve a slug to its ApiVersion instance. Falls back to a DB
     * read via the repository when the registry hasn't been primed.
     */
    public function resolve(string $slug): ?ApiVersion;

    /**
     * Every registered slug and its source class.
     *
     * @return array<string, string>
     */
    public function all(): array;
}
