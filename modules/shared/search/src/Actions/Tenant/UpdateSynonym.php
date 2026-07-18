<?php

declare(strict_types=1);

namespace Academorix\Search\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Patch;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Academorix\Search\Contracts\Data\SearchSynonymInterface;
use Academorix\Search\Data\Requests\UpdateSynonymRequestData;
use Academorix\Search\Data\SearchSynonymData;
use Academorix\Search\Enums\SearchPermission;
use Academorix\Search\Models\SearchSynonym;

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
