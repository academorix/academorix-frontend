<?php

/**
 * @file modules/shared/transfer/lang/en/transfer.php
 *
 * @description
 * English translations for the `academorix/transfer` module.
 */

declare(strict_types=1);

return [
    'errors' => [
        'kill_switched'              => 'The transfer feature is temporarily disabled.',
        'queue_disabled'             => 'Transfer queue is disabled — new jobs cannot be dispatched.',
        'entity_unknown'             => 'The requested entity is not registered with the transfer engine.',
        'entity_not_importable'      => 'This entity does not support imports.',
        'entity_not_exportable'      => 'This entity does not support exports.',
        'entity_not_sampleable'      => 'This entity does not support sample-data generation.',
        'format_unsupported'         => 'The requested format is not supported for this entity.',
        'mode_not_allowed'           => 'The requested import mode is not permitted.',
        'file_too_large'             => 'The uploaded file exceeds the maximum allowed size.',
        'row_limit_exceeded'         => 'The file exceeds the maximum row limit.',
        'concurrency_limit_exceeded' => 'You have too many transfer jobs in progress. Please wait for one to complete.',
        'sync_threshold_exceeded'    => 'The inline export path would exceed the row-count threshold. Use the asynchronous endpoint.',
        'job_not_found'              => 'The transfer job could not be found.',
        'job_not_cancellable'        => 'This transfer job is already in a terminal state and cannot be cancelled.',
        'job_not_retryable'          => 'This transfer job is not in a retryable state.',
        'invalid_state_transition'   => 'Invalid transfer job state transition.',
        'shard_not_found'            => 'The transfer shard could not be found.',
        'shard_not_retryable'        => 'This shard is not in a retryable state.',
        'artifact_not_found'         => 'The transfer artifact could not be found.',
        'artifact_purged'            => 'The transfer artifact has been purged and is no longer downloadable.',
        'artifact_link_invalid'      => 'The download link is invalid.',
        'artifact_link_expired'      => 'The download link has expired.',
        'mapping_profile_not_found'  => 'The mapping profile could not be found.',
        'mapping_profile_invalid'    => 'The mapping profile references an attribute that is not declared on the target entity.',
        'duplicate_row'              => 'The row conflicts with an existing record.',
        'lookup_failed'              => 'A referenced record could not be resolved.',
        'csv_malformed'              => 'The CSV file is malformed.',
        'encoding_unsupported'       => 'The file encoding is not supported.',
        'tenant_mismatch'            => 'The row belongs to a different tenant.',
        'storage_failure'            => 'A storage failure occurred while processing the transfer.',
        'laravel_excel_failure'      => 'An unexpected error occurred while processing the spreadsheet.',
    ],

    'labels' => [
        'transfer'          => 'Transfer',
        'job'               => 'Transfer job',
        'jobs'              => 'Transfer jobs',
        'shard'             => 'Shard',
        'artifact'          => 'Artifact',
        'mapping_profile'   => 'Mapping profile',
        'import'            => 'Import',
        'export'            => 'Export',
        'sample'            => 'Sample data',
        'kind'              => 'Kind',
        'entity'            => 'Entity',
        'format'            => 'Format',
        'mode'              => 'Mode',
        'status'            => 'Status',
        'counters'          => 'Counters',
        'started_at'        => 'Started at',
        'completed_at'      => 'Completed at',
        'download'          => 'Download',
        'download_errors'   => 'Download errors',
    ],

    'notifications' => [
        'completed' => [
            'subject' => 'Your data transfer completed',
        ],
        'partially_succeeded' => [
            'subject' => 'Your data transfer completed with errors',
        ],
        'failed' => [
            'subject' => 'Your data transfer failed',
        ],
    ],
];
