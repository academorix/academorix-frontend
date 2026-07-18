<?php

declare(strict_types=1);

namespace Academorix\Application\Repositories;

use Academorix\Application\Contracts\Data\ApplicationInterface;
use Academorix\Application\Contracts\Repositories\ApplicationRepositoryInterface;
use Academorix\Application\Models\Application;
use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;

/**
 * Eloquent implementation of {@see ApplicationRepositoryInterface}.
 *
 * ## What this class owns
 *
 * Three domain queries the {@see \Academorix\Application\Services\ApplicationResolver}
 * + `resolve.application` middleware call on every request:
 *
 *   - {@see findByHost()}   — central-host + platform-admin-host lookup,
 *                             falls back to the default row.
 *   - {@see findBySlug()}   — URL-safe identifier lookup.
 *   - {@see findDefault()}  — the fallback row for unmatched hosts.
 *
 * ## Attribute-first wiring
 *
 * `#[AsRepository]` — pre-resolves every configuration attribute into
 *   `RepositoryConfigRegistry` at boot (Octane-safe, zero runtime reflection).
 * `#[UseModel(ApplicationInterface::class)]` — the interface carries
 *   `#[Bind(Application::class)]` so the container resolves the concrete.
 *   Replaces the legacy `modelClass()` / `tableName()` overrides.
 * `#[Cacheable(ttl: 3600, tags: true)]` — Applications change ~never
 *   (~1-8 rows lifetime). Caching every read for an hour is safe;
 *   observer-driven invalidation flushes on write.
 * `#[Filterable([...])]` — request-driven filter whitelist. Every filter
 *   the platform-admin list surface exposes MUST appear here or spatie
 *   query builder rejects it (defence-in-depth).
 *
 * The container binding to {@see ApplicationRepositoryInterface} lives
 * on the interface (`#[Bind(EloquentApplicationRepository::class)]`),
 * following Laravel-canonical placement (`.kiro/steering/php-attributes.md`
 * §Container attributes). This class carries NO `#[Bind]`.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(ApplicationInterface::class)]
#[Cacheable(ttl: 3600, tags: true)]
#[Filterable([
    ApplicationInterface::ATTR_SLUG                  => ['$eq', '$contains', '$startsWith'],
    ApplicationInterface::ATTR_NAME                  => ['$contains', '$startsWith'],
    ApplicationInterface::ATTR_CENTRAL_HOST          => ['$eq', '$contains'],
    ApplicationInterface::ATTR_PLATFORM_ADMIN_HOST   => ['$eq', '$contains'],
    ApplicationInterface::ATTR_DEFAULT_BUSINESS_TYPE => ['$eq', '$in'],
    ApplicationInterface::ATTR_IS_DEFAULT            => ['$eq'],
    ApplicationInterface::ATTR_IS_SYSTEM             => ['$eq'],
])]
final class EloquentApplicationRepository extends Repository implements ApplicationRepositoryInterface
{
    /**
     * {@inheritDoc}
     *
     * Matches on `central_host` OR `platform_admin_host`. Both columns
     * carry unique indexes so this query is a single index seek. Falls
     * back to the default row when no host matches.
     */
    public function findByHost(string $host): ?Application
    {
        $host = \strtolower(\trim($host));

        /** @var Application|null $match */
        $match = $this->query()
            ->where(ApplicationInterface::ATTR_CENTRAL_HOST, $host)
            ->orWhere(ApplicationInterface::ATTR_PLATFORM_ADMIN_HOST, $host)
            ->first();

        return $match ?? $this->findDefault();
    }

    /**
     * {@inheritDoc}
     */
    public function findBySlug(string $slug): ?Application
    {
        /** @var Application|null $match */
        $match = $this->query()
            ->where(ApplicationInterface::ATTR_SLUG, \strtolower(\trim($slug)))
            ->first();

        return $match;
    }

    /**
     * {@inheritDoc}
     *
     * A partial unique index on `is_default = TRUE` enforces the
     * one-default-per-deployment invariant at the DB level.
     */
    public function findDefault(): ?Application
    {
        /** @var Application|null $match */
        $match = $this->query()
            ->where(ApplicationInterface::ATTR_IS_DEFAULT, true)
            ->first();

        return $match;
    }
}
