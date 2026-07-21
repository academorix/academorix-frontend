<?php

declare(strict_types=1);

namespace Stackra\Search\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
use Stackra\Search\Contracts\Data\SearchSynonymInterface;
use Stackra\Search\Data\Requests\UpdateSynonymRequestData;
use Stackra\Search\Data\SearchSynonymData;
use Stackra\Search\Enums\SearchPermission;
use Stackra\Search\Models\SearchSynonym;

/**
 * `PATCH /api/v1/search/synonyms/{synonym}` — update own synonym.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsAction(name: 'search.tenant.synonyms.update')]
#[Patch('/api/v1/search/synonyms/{synonym}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('synonym')]
#[RequirePermission(SearchPermission::SynonymsUpdate)]
final class UpdateSynonym
{
    use AsController;

    public function __invoke(SearchSynonym $synonym, UpdateSynonymRequestData $data): SearchSynonymData
    {
        // Only overwrite columns the caller explicitly set — leaves
        // unspecified fields untouched.
        $attrs = [];

        if ($data->kind !== null) {
            $attrs[SearchSynonymInterface::ATTR_KIND] = $data->kind;
        }
        if ($data->terms !== null) {
            $attrs[SearchSynonymInterface::ATTR_TERMS] = $data->terms;
        }
        if ($data->oneWaySource !== null) {
            $attrs[SearchSynonymInterface::ATTR_ONE_WAY_SOURCE] = $data->oneWaySource;
        }
        if ($data->oneWayTargets !== null) {
            $attrs[SearchSynonymInterface::ATTR_ONE_WAY_TARGETS] = $data->oneWayTargets;
        }
        if ($data->isActive !== null) {
            $attrs[SearchSynonymInterface::ATTR_IS_ACTIVE] = $data->isActive;
        }
        if ($data->description !== null) {
            $attrs[SearchSynonymInterface::ATTR_DESCRIPTION] = $data->description;
        }

        $synonym->fill($attrs)->save();

        return SearchSynonymData::fromModel($synonym->fresh() ?? $synonym);
    }
}
