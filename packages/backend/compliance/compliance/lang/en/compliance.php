<?php

/**
 * @file modules/compliance/compliance/lang/en/compliance.php
 *
 * @description
 * English translations for the `stackra/compliance` module.
 */

declare(strict_types=1);

return [
    'errors' => [
        'not_found'                   => 'Compliance record not found.',
        'consent_required'            => 'Consent for category ":category" is required.',
        'consent_category_missing'    => 'Consent category ":category" is not defined.',
        'consent_category_locked'     => 'Consent category ":category" is a platform default and cannot be modified.',
        'dsar_not_found'              => 'DSAR request not found.',
        'dsar_state_invalid'          => 'DSAR state transition ":from" -> ":to" is not permitted.',
        'dsar_quota_exhausted'        => 'DSAR quota exhausted for this month.',
        'legal_hold_active'           => 'Row is under legal hold and cannot be modified.',
        'legal_hold_two_person'       => 'Legal hold requires two-person approval.',
        'retention_run_failed'        => 'Retention sweep failed: :reason.',
        'subprocessor_locked'         => 'System subprocessors cannot be modified from the admin surface.',
        'safeguarding_state_invalid'  => 'Safeguarding incident state transition is not permitted.',
    ],

    'validation' => [
        'valid_dsar_action'           => 'The :attribute must be one of: export, erase, rectify, restrict.',
        'valid_consent_decision'      => 'The :attribute must be one of: granted, withdrawn.',
        'valid_retention_window'      => 'The :attribute must be a positive number of days.',
        'valid_legal_hold_scope'      => 'The :attribute must be one of: subject, tenant, case, class.',
        'valid_subprocessor_role'     => 'The :attribute must be a supported subprocessor role.',
        'valid_safeguarding_severity' => 'The :attribute must be one of: info, concern, urgent, critical.',
    ],

    'labels' => [
        'consent_category'      => 'Consent category',
        'consent_record'        => 'Consent record',
        'dsar'                  => 'Data-subject request',
        'dsar_artefact'         => 'DSAR artefact',
        'legal_hold'            => 'Legal hold',
        'retention_run'         => 'Retention run',
        'subprocessor'          => 'Subprocessor',
        'safeguarding_incident' => 'Safeguarding incident',
    ],
];
