<?php

declare(strict_types=1);

/**
 * Has Request Filtering Trait
 *
 * Provides Request Filtering capabilities to models and classes that use this trait.
 * Encapsulates reusable Request Filtering logic for the Framework module.
 *
 * @category Concerns
 *
 * @since    1.0.0
 */
namespace Stackra\Crud\Concerns\Repository;

use Stackra\Crud\Criteria\RequestFilterCriteria;
use Stackra\Crud\Criteria\RequestSearchCriteria;
use Stackra\Crud\Criteria\RequestSortCriteria;
use Stackra\Crud\Registries\RepositoryConfigRegistry;

/**
 * HasRequestFiltering Trait.
 *
 * Provides request-based filter(), sort(), and search() methods that
 * read configuration from the RepositoryConfigRegistry and push the
 * appropriate criteria onto the stack.
 *
 * Expects the host class to provide:
 * - `pushCriteria(CriteriaInterface $criteria): static` (from HasCriteria)
 *
 * @since 2.0.0
 */
trait HasRequestFiltering
{
    /**
     * Apply request-based filters using the #[Filterable] attribute config.
     *
     * Reads `?filters[field][$operator]=value` from the current request
     * and pushes a RequestFilterCriteria onto the criteria stack.
     */
    public function filter(): static
    {
        $registry = resolve(RepositoryConfigRegistry::class);
        $config = $registry->get(static::class);

        $allowedFields = $config['filterable'] ?? '*';

        $this->pushCriteria(new RequestFilterCriteria(
            request: request(),
            allowedFields: $allowedFields,
        ));

        return $this;
    }

    /**
     * Apply request-based sorting using the #[Sortable] attribute config.
     *
     * Reads `?sort=field:direction` from the current request and pushes
     * a RequestSortCriteria onto the criteria stack.
     */
    public function sort(): static
    {
        $registry = resolve(RepositoryConfigRegistry::class);
        $config = $registry->get(static::class);

        $allowedFields = $config['sortable'] ?? '*';

        $this->pushCriteria(new RequestSortCriteria(
            request: request(),
            allowedFields: $allowedFields,
        ));

        return $this;
    }

    /**
     * Apply request-based search using the #[Searchable] attribute config.
     *
     * Reads `?search=term` from the current request and pushes a
     * RequestSearchCriteria onto the criteria stack.
     */
    public function search(): static
    {
        $registry = resolve(RepositoryConfigRegistry::class);
        $config = $registry->get(static::class);

        $searchableFields = $config['searchable'] ?? [];

        $this->pushCriteria(new RequestSearchCriteria(
            request: request(),
            searchableFields: $searchableFields,
        ));

        return $this;
    }
}
