<?php

declare(strict_types=1);

namespace Academorix\Search\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Search\Models\SearchSynonym;
use Academorix\Search\Repositories\EloquentSearchSynonymRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see SearchSynonym}.
 *
 * @extends RepositoryInterface<SearchSynonym>
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Bind(EloquentSearchSynonymRepository::class)]
interface SearchSynonymRepositoryInterface extends RepositoryInterface
{
    /**
     * Every active synonym for a `(tenant, language)` pair — the effective
     * set the engine adapter pushes to its native synonym storage.
     *
     * @return Collection<int, SearchSynonym>
     */
    public function activeFor(?string $tenantId, string $language): Collection;

    /**
     * Every system-seeded synonym.
     *
     * @return Collection<int, SearchSynonym>
     */
    public function systemRows(): Collection;
}
