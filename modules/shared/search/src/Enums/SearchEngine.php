<?php

declare(strict_types=1);

namespace Academorix\Search\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Search engine adapter identifier.
 *
 * Every `#[Searchable]`-marked model pins one of these adapters as
 * its engine. The `EngineRegistry` resolves the identifier to the
 * concrete `EngineAdapterInterface` implementation at dispatch time.
 *
 * ## Cases
 *
 *  * {@see self::Meilisearch} — default user-facing adapter with
 *    typo tolerance, prefix, phrase, boolean, faceting, sort, boost,
 *    synonyms, stopwords, highlight, search-as-you-type support.
 *  * {@see self::PostgresFts} — internal-only default. Postgres
 *    tsvector-backed. Zero new infrastructure.
 *  * {@see self::Pgvector} — semantic similarity (v1 stub). Feature-
 *    flag + entitlement gated.
 *  * {@see self::Elasticsearch} — v2 stub. Feature-flag gated.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum SearchEngine: string
{
    use Enum;

    /**
     * Meilisearch — default user-facing adapter.
     */
    #[Label('Meilisearch')]
    #[Description('Default user-facing engine. Typo tolerance, faceting, ranking, synonyms, and search-as-you-type.')]
    case Meilisearch = 'meilisearch';

    /**
     * Postgres FTS — internal-only default. Zero new infrastructure.
     */
    #[Label('Postgres FTS')]
    #[Description('Postgres tsvector-backed adapter. Preferred for internal-only indexes (audit, activity, admin).')]
    case PostgresFts = 'postgres-fts';

    /**
     * pgvector — semantic similarity. v1 stub.
     */
    #[Label('pgvector')]
    #[Description('Semantic-similarity adapter over the pgvector Postgres extension. Feature-flag + entitlement gated.')]
    case Pgvector = 'pgvector';

    /**
     * Elasticsearch — v2 stub. Never dispatches.
     */
    #[Label('Elasticsearch')]
    #[Description('v2 stub. Never dispatches; throws SEARCH_ENGINE_NOT_ENABLED until a concrete adapter ships.')]
    case Elasticsearch = 'elasticsearch';
}
