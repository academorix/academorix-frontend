<?php

declare(strict_types=1);

namespace Academorix\Search\Observers;

use Academorix\Search\Contracts\Data\SearchIndexInterface;
use Academorix\Search\Enums\SearchIndexStatus;
use Academorix\Search\Events\SearchIndexAliasSwapped;
use Academorix\Search\Events\SearchIndexRegistered;
use Academorix\Search\Events\SearchIndexUnregistered;
use Academorix\Search\Models\SearchIndex;

/**
 * Lifecycle side effects on {@see SearchIndex}.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchIndexObserver
{
    /**
     * `creating` — populate defaults + derive index_name / live_alias.
     */
    public function creating(SearchIndex $index): void
    {
        // HasPrefixedUlid handles the primary key. Fill sensible
        // defaults so callers don't have to.
        if ($index->{SearchIndexInterface::ATTR_STATUS} === null) {
            $index->{SearchIndexInterface::ATTR_STATUS} = SearchIndexStatus::Registering;
        }

        if ($index->{SearchIndexInterface::ATTR_CURRENT_VERSION} === null) {
            $index->{SearchIndexInterface::ATTR_CURRENT_VERSION} = 1;
        }

        // Derive index_name from the model FQCN when the caller
        // hasn't overridden. Kebab-case, `\` → `_`.
        if (empty($index->{SearchIndexInterface::ATTR_INDEX_NAME})) {
            $model = (string) $index->{SearchIndexInterface::ATTR_MODEL_CLASS};
            $index->{SearchIndexInterface::ATTR_INDEX_NAME} =
                \strtolower(\str_replace(['\\', '/'], '_', $model));
        }

        if (empty($index->{SearchIndexInterface::ATTR_LIVE_ALIAS})) {
            $index->{SearchIndexInterface::ATTR_LIVE_ALIAS} =
                $index->{SearchIndexInterface::ATTR_INDEX_NAME} . '_live';
        }
    }

    /**
     * `created` — announce registration to activity + audit + metrics.
     */
    public function created(SearchIndex $index): void
    {
        SearchIndexRegistered::dispatch($index);
    }

    /**
     * `updated` — detect alias swap; fire the matching event.
     */
    public function updated(SearchIndex $index): void
    {
        if (
            $index->wasChanged(SearchIndexInterface::ATTR_CURRENT_VERSION)
            && $index->wasChanged(SearchIndexInterface::ATTR_LIVE_ALIAS)
        ) {
            SearchIndexAliasSwapped::dispatch($index);
        }
    }

    /**
     * `deleted` — announce unregistration.
     */
    public function deleted(SearchIndex $index): void
    {
        SearchIndexUnregistered::dispatch($index);
    }
}
