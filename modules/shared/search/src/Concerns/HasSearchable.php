<?php

declare(strict_types=1);

namespace Academorix\Search\Concerns;

use Laravel\Scout\Searchable as ScoutSearchable;

/**
 * Opt-in trait for models that participate in the search pipeline.
 *
 * Wraps Laravel Scout's own {@see ScoutSearchable} trait and layers
 * our conventions:
 *
 *   - Tenant-scoped push (via composing `BelongsToTenant`).
 *   - Permission-scoped `toSearchableArray()` — restricted-tier
 *     columns are never indexed.
 *   - Alias-aware routing — `Model::search()` hits `{index}_live`.
 *
 * The trait is intentionally thin — every concern that requires
 * runtime state (permission checks, restricted-tier filtering) is
 * left to concrete overrides on the composing model until the
 * engine-adapter build-out lands.
 *
 * @category Search
 *
 * @since    0.1.0
 */
trait HasSearchable
{
    use ScoutSearchable;
}
