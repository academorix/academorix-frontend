<?php

declare(strict_types=1);

/**
 * Search Driver Enumeration
 *
 * Defines the set of allowed values for Search Driver within the Settings module.
 * Supported values include: Database, Meilisearch, Elasticsearch, Algolia.
 *
 * @category Enums
 *
 * @since    1.0.0
 */
namespace Academorix\Settings\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Enum;

/**
 * Search Driver Enum.
 *
 * Supported search engine drivers for full-text search functionality.
 *
 * @method static DATABASE()      Returns the DATABASE enum instance
 * @method static MEILISEARCH()   Returns the MEILISEARCH enum instance
 * @method static ELASTICSEARCH() Returns the ELASTICSEARCH enum instance
 * @method static ALGOLIA()       Returns the ALGOLIA enum instance
 *
 * @since 1.0.0
 */
enum SearchDriver: string
{
    use Enum;

    /**
     * Database-driven search using SQL LIKE or full-text indexes.
     */
    #[Label('Database')]
    #[Description('Database-driven search using SQL LIKE or full-text indexes. No external service required.')]
    case Database = 'database';

    /**
     * Meilisearch — a fast, open-source search engine.
     */
    #[Label('Meilisearch')]
    #[Description('Meilisearch search engine. A fast, open-source, typo-tolerant search engine.')]
    case Meilisearch = 'meilisearch';

    /**
     * Elasticsearch — a distributed, RESTful search and analytics engine.
     */
    #[Label('Elasticsearch')]
    #[Description('Elasticsearch search engine. A distributed, RESTful search and analytics engine.')]
    case Elasticsearch = 'elasticsearch';

    /**
     * Algolia — a hosted search-as-a-service platform.
     */
    #[Label('Algolia')]
    #[Description('Algolia search engine. A hosted search-as-a-service platform with real-time indexing.')]
    case Algolia = 'algolia';
}
