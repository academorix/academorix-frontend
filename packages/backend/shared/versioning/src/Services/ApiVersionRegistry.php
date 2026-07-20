<?php

declare(strict_types=1);

namespace Academorix\Versioning\Services;

use Academorix\Versioning\Attributes\AsApiSurface;
use Academorix\Versioning\Contracts\Repositories\ApiVersionRepositoryInterface;
use Academorix\Versioning\Contracts\Services\ApiVersionRegistryInterface;
use Academorix\Versioning\Models\ApiVersion;
use Illuminate\Container\Attributes\Singleton;

/**
 * In-memory {@see ApiVersionRegistryInterface}.
 *
 * The registry caches `slug => className` pairs registered at boot.
 * When a slug isn't in the registry, `resolve()` falls back to a DB
 * lookup via the repository — so the registry acts as a hot-cache in
 * front of the store rather than an authoritative source.
 *
 * Two population paths:
 *
 *   - {@see register()} — slug-based, called by tests + custom pins.
 *   - {@see registerSurface()} — attribute-driven, called by the
 *     framework's hydration pump for every `#[AsApiSurface]` hit; it
 *     fans out to `register()` once per declared version slug.
 *
 * `#[Singleton]` because the registry is a pure function of the boot
 * pass; safely shared across every request under Octane.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[Singleton]
final class ApiVersionRegistry implements ApiVersionRegistryInterface
{
    /**
     * Slug -> source class name.
     *
     * @var array<string, string>
     */
    private array $entries = [];

    /**
     * Memoised slug -> ApiVersion resolutions to avoid repeat DB reads
     * across a request.
     *
     * @var array<string, ApiVersion|null>
     */
    private array $memo = [];

    public function __construct(
        private readonly ApiVersionRepositoryInterface $repository,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function register(string $slug, string $className): void
    {
        $this->entries[$slug] = $className;
        unset($this->memo[$slug]);
    }

    /**
     * {@inheritDoc}
     */
    public function registerSurface(string $className, AsApiSurface $attribute): void
    {
        // Fan out — one surface class declares N version slugs. The
        // registry stores each slug pointing at the surface FQCN.
        // Empty / non-string entries in $attribute->versions are
        // silently skipped rather than throwing at boot, matching the
        // fail-soft discovery contract.
        foreach ($attribute->versions as $slug) {
            if (\is_string($slug) && $slug !== '') {
                $this->register($slug, $className);
            }
        }
    }

    /**
     * {@inheritDoc}
     */
    public function resolve(string $slug): ?ApiVersion
    {
        if (\array_key_exists($slug, $this->memo)) {
            return $this->memo[$slug];
        }

        // Fall back to the store — registry entries are hints, the DB
        // is authoritative.
        $version = $this->repository->findBySlug($slug);

        $this->memo[$slug] = $version;

        return $version;
    }

    /**
     * {@inheritDoc}
     */
    public function all(): array
    {
        return $this->entries;
    }
}
