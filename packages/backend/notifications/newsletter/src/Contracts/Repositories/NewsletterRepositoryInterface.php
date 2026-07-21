<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Contracts\Repositories;

use Stackra\Crud\Contracts\RepositoryInterface;
use Stackra\Newsletter\Models\Newsletter;
use Stackra\Newsletter\Repositories\EloquentNewsletterRepository;
use Illuminate\Container\Attributes\Bind;

/**
 * Repository contract for {@see Newsletter}.
 *
 * Adds tenant-scoped slug lookups + the reputation breach counter
 * mutator on top of the base CRUD surface. Consumers type-hint the
 * interface, not the concrete repository, so the container can swap
 * in a stub for tests.
 *
 * @extends RepositoryInterface<Newsletter>
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[Bind(EloquentNewsletterRepository::class)]
interface NewsletterRepositoryInterface extends RepositoryInterface
{
    /**
     * Find a newsletter by tenant + slug pair, or `null` when none
     * matches. `slug` is unique within a tenant so at most one row
     * returns.
     *
     * @param  string  $tenantId  Tenant to scope by.
     * @param  string  $slug      Newsletter slug.
     */
    public function findBySlug(string $tenantId, string $slug): ?Newsletter;
}
