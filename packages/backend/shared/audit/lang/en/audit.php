<?php

/**
 * @file modules/shared/audit/lang/en/audit.php
 *
 * @description
 * English translations for the `stackra/audit` module.
 */

declare(strict_types=1);

return [
    'errors' => [
        'not_found'      => 'No audit row found for the given identifier.',
        'chain_broken'   => 'Audit chain is broken — potential tampering detected. Notify the compliance officer.',
        'export_failed'  => 'DSAR export failed. See the job logs for the underlying cause.',
    ],

    'labels' => [
        'audit'  => 'Audit',
        'audits' => 'Audits',
    ],

    'chain_states' => [
        'pending'  => 'Pending verification',
        'verified' => 'Verified',
        'broken'   => 'Broken — tampering suspected',
    ],
];
