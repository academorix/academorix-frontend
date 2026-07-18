<?php

/**
 * @file modules/notifications/notifications-sms/lang/en/notifications-sms.php
 *
 * @description
 * English translations for the `academorix/notifications-sms` module. Loaded
 * under the `notifications-sms::` namespace.
 */

declare(strict_types=1);

return [
    'errors' => [
        'opted_out'                     => 'The recipient has opted out of SMS notifications.',
        'cost_cap_exceeded'             => 'The tenant has reached its monthly SMS cost cap.',
        'per_message_cost_exceeded'     => 'The estimated cost for this recipient exceeds the per-message maximum.',
        'country_blocked'               => 'The destination country is not in the tenant\'s allowed list.',
        'invalid_phone'                 => 'The phone number is not a valid E.164 identifier.',
        'undeliverable'                 => 'The carrier reported the message is permanently undeliverable.',
        'provider_error'                => 'The SMS provider returned an error.',
        'provider_disabled'             => 'The configured SMS provider is currently disabled.',
        'rate_limited'                  => 'The SMS provider is rate-limiting the tenant.',
        'message_too_long'              => 'The message would exceed the configured maximum segment count.',
        'stop_keyword_processing_failed' => 'Failed to record STOP opt-out. Retried immediately.',
    ],

    'labels' => [
        'sms_opt_out'  => 'SMS Opt-Out',
        'sms_opt_outs' => 'SMS Opt-Outs',
        'phone'        => 'Phone Number',
        'reason'       => 'Reason',
        'provider'     => 'Provider',
    ],
];
