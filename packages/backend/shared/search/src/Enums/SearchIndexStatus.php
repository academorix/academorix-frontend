<?php

declare(strict_types=1);

namespace Stackra\Search\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Lifecycle state of a `SearchIndex` row.
 *
 * ## Cases
 *
 *  * {@see self::Registering} — the row was just seeded by discovery;
 *    the physical engine index has not been created yet.
 *  * {@see self::Live}         — the index is ready for queries and
 *    document pushes.
 *  * {@see self::Reindexing}   — a reindex is in flight against a new
 *    version; queries continue against the current alias.
 *  * {@see self::Disabled}     — manually disabled or a config drift
 *    prevents automatic recovery.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum SearchIndexStatus: string
{
    use Enum;

    /**
     * Newly registered; physical index not yet created.
     */
    #[Label('Registering')]
    #[Description('Row was just seeded; the physical engine index has not been created yet.')]
    case Registering = 'registering';

    /**
     * Live — accepts queries + pushes.
     */
    #[Label('Live')]
    #[Description('The index is live: queries hit the current alias and document pushes route through the trait.')]
    case Live = 'live';

    /**
     * A reindex is running against a new version.
     */
    #[Label('Reindexing')]
    #[Description('A reindex is in progress against a new version; the current alias continues to serve reads.')]
    case Reindexing = 'reindexing';

    /**
     * Manually disabled; no queries + no pushes.
     */
    #[Label('Disabled')]
    #[Description('Manually disabled. Queries and pushes fail with SEARCH_INDEX_NOT_ACTIVE.')]
    case Disabled = 'disabled';
}
