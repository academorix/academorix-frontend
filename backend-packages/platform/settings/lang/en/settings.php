<?php

/**
 * @file modules/platform/settings/lang/en/settings.php
 *
 * @description
 * English translations for the `academorix/settings` module.
 */

declare(strict_types=1);

return [
    'errors' => [
        'not_found'                => 'No setting found for key ":key".',
        'group_not_found'          => 'No settings group registered under ":group".',
        'field_not_found'          => 'No field ":field" registered on group ":group".',
        'validation_failed'        => 'One or more setting values failed validation.',
        'field_locked'             => 'The field ":key" is locked at a higher scope and cannot be overridden.',
        'scope_invalid'            => 'Scope ":scope" is not permitted for this group.',
        'sensitive_reveal_denied'  => 'Reveal of sensitive fields requires the `settings.view-sensitive` permission.',
        'write_refused'            => 'Write to ":key" was refused: :reason.',
        'writes_kill_switched'     => 'Settings writes are currently disabled by the platform.',
        'dual_write_failed'        => 'Settings write persisted but activity + audit dual-write failed.',
        'quota_exceeded'           => 'Setting write would exceed the per-scope override quota.',
        'schema_drift'             => 'The schema for ":key" changed since deploy; a migration is required.',
    ],

    'validation' => [
        'unknown_field' => 'The field :attribute is not registered on the ":group" group.',
    ],

    'labels' => [
        'setting'          => 'Setting',
        'settings'         => 'Settings',
        'group'            => 'Group',
        'groups'           => 'Groups',
        'schema'           => 'Schema',
        'value'            => 'Value',
        'sensitive'        => 'Sensitive',
        'system'           => 'System',
        'tenant'           => 'Tenant',
        'user'             => 'User',
    ],
];
