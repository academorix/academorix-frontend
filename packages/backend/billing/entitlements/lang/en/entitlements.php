<?php

/**
 * @file modules/billing/entitlements/lang/en/entitlements.php
 *
 * @description
 * English translations for the `stackra/entitlements` module.
 */

declare(strict_types=1);

return [
    'errors' => [
        'not_found'      => 'No entitlement found for key ":key" on this tenant.',
        'exceeded'       => 'Entitlement ":key" quota exceeded — :used/:limit used.',
        'kind_mismatch'  => 'Entitlement ":key" has kind :actual but consumer expected :expected.',
        'sync_failed'    => 'Failed to sync entitlements from plan ":plan": :reason.',
    ],

    'validation' => [
        'valid_entitlement_key'  => 'The :attribute must be a dot-separated lowercase identifier (e.g. "webhook.subscriptions.max").',
        'valid_entitlement_kind' => 'The :attribute must be one of: slot, pool, boolean, unlimited.',
    ],

    'labels' => [
        'entitlement'       => 'Entitlement',
        'entitlements'      => 'Entitlements',
        'entitlement_usage' => 'Usage',
        'usage_history'     => 'Usage history',
    ],
];
