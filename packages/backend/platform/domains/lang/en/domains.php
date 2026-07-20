<?php

/**
 * @file modules/platform/domains/lang/en/domains.php
 *
 * @description
 * English translations for the `academorix/domains` module. Loaded
 * under the `domains::` namespace.
 */

declare(strict_types=1);

return [
    'errors' => [
        'not_found'              => 'The requested domain does not exist.',
        'not_verified'           => 'This domain is not verified. Complete DNS verification before promoting it to primary.',
        'verification_exhausted' => 'Verification retry cap reached. Requires manual replay.',
        'host_invalid'           => 'The hostname is not a valid RFC 1035 domain.',
        'last_primary'           => 'Cannot delete the tenant\'s last primary domain. Promote another domain first.',
    ],

    'validation' => [
        'valid_domain_host' => 'The :attribute must be a valid domain hostname (RFC 1035 labels; no IPs; no reserved TLDs).',
    ],

    'labels' => [
        'domain'         => 'Domain',
        'domains'        => 'Domains',
        'domain_record'  => 'DNS Record',
        'domain_records' => 'DNS Records',
    ],
];
