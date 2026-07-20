<?php

declare(strict_types=1);

namespace Academorix\Search\Observers;

use Academorix\Search\Contracts\Data\SearchSynonymInterface;
use Academorix\Search\Events\SearchSynonymCreated;
use Academorix\Search\Events\SearchSynonymDeleted;
use Academorix\Search\Events\SearchSynonymUpdated;
use Academorix\Search\Models\SearchSynonym;

/**
 * Lifecycle side effects on {@see SearchSynonym}.
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchSynonymObserver
{
    /**
     * `creating` — normalise terms + populate defaults.
     */
    public function creating(SearchSynonym $synonym): void
    {
        if ($synonym->{SearchSynonymInterface::ATTR_IS_ACTIVE} === null) {
            $synonym->{SearchSynonymInterface::ATTR_IS_ACTIVE} = true;
        }

        if ($synonym->{SearchSynonymInterface::ATTR_SOURCE} === null) {
            $synonym->{SearchSynonymInterface::ATTR_SOURCE} = 'tenant_admin';
        }

        // Normalise `terms` — lowercase, trim, dedupe. Stays a JSON
        // array on the column; the transformation is idempotent.
        $terms = (array) ($synonym->{SearchSynonymInterface::ATTR_TERMS} ?? []);
        if ($terms !== []) {
            $normalised = \array_values(\array_unique(\array_map(
                static fn ($t): string => \strtolower(\trim((string) $t)),
                $terms,
            )));
            $synonym->{SearchSynonymInterface::ATTR_TERMS} = $normalised;
        }
    }

    /**
     * `created` — announce creation + trigger cache warm.
     */
    public function created(SearchSynonym $synonym): void
    {
        SearchSynonymCreated::dispatch($synonym);
    }

    /**
     * `updated` — announce update + trigger cache warm.
     */
    public function updated(SearchSynonym $synonym): void
    {
        SearchSynonymUpdated::dispatch($synonym);
    }

    /**
     * `deleted` — announce deletion + trigger cache warm.
     */
    public function deleted(SearchSynonym $synonym): void
    {
        SearchSynonymDeleted::dispatch($synonym);
    }
}
