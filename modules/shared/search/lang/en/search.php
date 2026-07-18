<?php

/**
 * @file lang/en/search.php
 *
 * @description
 * English translation strings for the Search module. Namespace
 * prefix is `search::` — consumers reach these keys via
 * `__('search::errors.query_invalid')`, etc.
 */

declare(strict_types=1);

return [
    'errors' => [
        'kill_switched'            => 'Search is temporarily disabled.',
        'queue_disabled'           => 'Search indexing is temporarily disabled.',
        'engine_unavailable'       => 'The search engine is unreachable.',
        'engine_not_supported'     => 'The requested search engine is not supported.',
        'engine_not_enabled'       => 'The requested search engine is not enabled.',
        'index_not_found'          => 'Search index not found.',
        'index_not_active'         => 'Search index is not active.',
        'index_limit_exceeded'     => 'Search index limit exceeded.',
        'model_not_searchable'     => 'The requested model is not registered with the search catalogue.',
        'query_too_long'           => 'The search query is too long.',
        'query_invalid'            => 'The search query is invalid.',
        'rate_limit_exceeded'      => 'Search rate limit exceeded.',
        'job_not_found'            => 'Search sync job not found.',
        'job_not_cancellable'      => 'Search sync job is not cancellable.',
        'invalid_state_transition' => 'Invalid search sync job state transition.',
        'alias_swap_failed'        => 'Search index alias swap failed.',
        'synonym_not_found'        => 'Search synonym not found.',
        'synonym_system_immutable' => 'System search synonyms cannot be modified.',
        'synonym_invalid'          => 'The search synonym is invalid.',
        'saved_query_not_found'    => 'Saved search query not found.',
        'saved_query_invalid'      => 'The saved search query is invalid.',
        'reindex_in_progress'      => 'A reindex is already in progress for this index.',
        'concurrency_limit_exceeded' => 'Search reindex concurrency limit exceeded.',
        'artifact_source_invalid'  => 'The referenced artifact source is invalid.',
        'artifact_source_unsupported' => 'Reindex from an artifact is not enabled for this tenant.',
        'language_unsupported'     => 'The requested language is not supported.',
        'scout_driver_failure'     => 'The underlying Scout driver failed.',
        'engine_timeout'           => 'The search engine timed out.',
        'config_hash_drift'        => 'The search index config has drifted.',
    ],
];
