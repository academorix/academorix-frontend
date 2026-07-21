<?php

/**
 * @file modules/platform/tenancy/lang/en/tenancy.php
 *
 * @description
 * English translations for the `stackra/tenancy` module. Loaded
 * under the `tenancy::` namespace.
 */

declare(strict_types=1);

return [
    'errors' => [
        // Host + resolution
        'tenant_not_found' => 'The tenant could not be resolved.',
        'application_not_found' => 'The application could not be resolved.',
        'tenant_context_not_allowed' => 'This endpoint may not run under a tenant context.',
        'tenant_not_resolved' => 'No tenant context bound to the current request.',

        // Lifecycle
        'tenant_suspended' => 'The tenant is currently suspended.',
        'tenant_archived' => 'The tenant is archived and no longer accepting requests.',

        // Cross-tenant guardrail
        'cross_tenant_access' => 'Refused — this operation would cross the tenant boundary.',

        // Slugs
        'slug_taken' => 'The slug is already in use in this application.',
        'slug_reserved' => 'The slug is reserved.',

        // System rows
        'system_row_refused' => 'Cannot modify a system tenant.',

        // Contacts
        'contact_verification_required' => 'A DPO or Legal contact must be verified before promotion to primary.',
        'contact_last_dpo' => 'Cannot delete the last remaining DPO contact for a GDPR-subject tenant.',
    ],

    'validation' => [
        'dns_safe_slug' => 'The :attribute must be a DNS-safe label (3-63 lowercase alphanumerics + hyphens, no leading/trailing/double hyphen).',
        'reserved_slug' => 'The :attribute is on the reserved slug list.',
    ],

    'labels' => [
        'tenant' => 'Tenant',
        'tenants' => 'Tenants',
        'tenant_contact' => 'Tenant Contact',
        'tenant_contacts' => 'Tenant Contacts',
    ],
];
