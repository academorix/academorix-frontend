<?php

declare(strict_types=1);

namespace Stackra\Application\Contracts\Repositories;

use Stackra\Application\Models\Application;
use Stackra\Application\Repositories\EloquentApplicationRepository;
use Stackra\Crud\Contracts\RepositoryInterface;
use Illuminate\Container\Attributes\Bind;

/**
 * Repository contract for {@see Application}.
 *
 * CRUD comes from {@see RepositoryInterface} (via `stackra/crud`'s
 * `Repository` base). Domain methods declared below cover the
 * host-resolution + fallback lookups the `resolve.application`
 * middleware needs on every request.
 *
 * `#[Bind]` follows the Laravel-canonical placement (`.kiro/steering/
 * php-attributes.md` §Container attributes): the attribute lives on
 * the ABSTRACT (this interface); the argument IS the CONCRETE
 * ({@see EloquentApplicationRepository}). Consumers type-hint the
 * interface; the container resolves to the concrete.
 *
 * @extends RepositoryInterface<Application>
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[Bind(EloquentApplicationRepository::class)]
interface ApplicationRepositoryInterface extends RepositoryInterface
{
    /**
     * Resolve an Application by its central or platform-admin host.
     *
     * The `resolve.application` middleware calls this on every request
     * to bind the Application context. Falls back to the default row
     * (`is_default = true`) when no host matches.
     *
     * @param  string  $host  Incoming request host (`Host:` header, no port).
     * @return Application|null  The matching Application, or `null` when no
     *                           row matches AND no default is configured.
     */
    public function findByHost(string $host): ?Application;

    /**
     * Resolve by slug — the URL-safe identifier used in prose,
     * subdomains, and cross-service tokens.
     *
     * @param  string  $slug  Application slug (lowercase, kebab-safe).
     * @return Application|null  The matching row, or `null`.
     */
    public function findBySlug(string $slug): ?Application;

    /**
     * The default Application — used when host resolution finds no
     * matching row. Exactly one row is `is_default = true` per
     * deployment (enforced by a partial unique index).
     *
     * @return Application|null  The default row, or `null` on fresh install.
     */
    public function findDefault(): ?Application;
}
