<?php

declare(strict_types=1);

namespace Stackra\Compliance\Contracts\Repositories;

use Stackra\Compliance\Models\ConsentCategory;
use Stackra\Compliance\Repositories\EloquentConsentCategoryRepository;
use Stackra\Crud\Contracts\RepositoryInterface;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see ConsentCategory}.
 *
 * @extends RepositoryInterface<ConsentCategory>
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Bind(EloquentConsentCategoryRepository::class)]
interface ConsentCategoryRepositoryInterface extends RepositoryInterface
{
    /**
     * Every category visible to a tenant — platform defaults +
     * tenant overrides. Tenant overrides shadow the defaults on
     * matching keys.
     *
     * @return Collection<int, ConsentCategory>
     */
    public function findVisibleForTenant(string $tenantId): Collection;

    /**
     * Look up a category by its key inside a tenant context.
     * Returns null when neither the platform default nor a tenant
     * override exists.
     */
    public function findByKey(string $tenantId, string $key): ?ConsentCategory;
}
