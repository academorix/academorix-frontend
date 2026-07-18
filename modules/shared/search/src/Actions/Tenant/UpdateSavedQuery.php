<?php

declare(strict_types=1);

namespace Academorix\Search\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Patch;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Academorix\Search\Contracts\Data\SearchSavedQueryInterface;
use Academorix\Search\Data\Requests\UpdateSavedQueryRequestData;
use Academorix\Search\Data\SearchSavedQueryData;
use Academorix\Search\Enums\SearchPermission;
use Academorix\Search\Models\SearchSavedQuery;

/**
 * `PATCH /api/v1/search/saved-queries/{query}` — update own saved query.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsAction(name: 'search.tenant.saved_queries.update')]
#[Patch('/api/v1/search/saved-queries/{query}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('query')]
#[RequirePermission(SearchPermission::SavedQueriesUpdate)]
final class UpdateSavedQuery
{
    use AsController;

    public function __invoke(SearchSavedQuery $query, UpdateSavedQueryRequestData $data): SearchSavedQueryData
    {
        $attrs = [];

        if ($data->name !== null) {
            $attrs[SearchSavedQueryInterface::ATTR_NAME] = $data->name;
        }
        if ($data->across !== null) {
            $attrs[SearchSavedQueryInterface::ATTR_ACROSS] = $data->across;
        }
        if ($data->query !== null) {
            $attrs[SearchSavedQueryInterface::ATTR_QUERY] = $data->query;
        }
        if ($data->filters !== null) {
            $attrs[SearchSavedQueryInterface::ATTR_FILTERS] = $data->filters;
        }
        if ($data->facets !== null) {
            $attrs[SearchSavedQueryInterface::ATTR_FACETS] = $data->facets;
        }
        if ($data->boosts !== null) {
            $attrs[SearchSavedQueryInterface::ATTR_BOOSTS] = $data->boosts;
        }
        if ($data->isShared !== null) {
            $attrs[SearchSavedQueryInterface::ATTR_IS_SHARED] = $data->isShared;
        }
        if ($data->isSmartList !== null) {
            $attrs[SearchSavedQueryInterface::ATTR_IS_SMART_LIST] = $data->isSmartList;
        }
        if ($data->description !== null) {
            $attrs[SearchSavedQueryInterface::ATTR_DESCRIPTION] = $data->description;
        }

        $query->fill($attrs)->save();

        return SearchSavedQueryData::fromModel($query->fresh() ?? $query);
    }
}
