<?php

/**
 * @file modules/platform/webhook/lang/en/webhook.php
 *
 * @description
 * English translations for the `stackra/webhook` module.
 */

declare(strict_types=1);

return [
    'errors' => [
        'subscription_not_found'        => 'The requested webhook subscription does not exist.',
        'subscription_disabled'         => 'This webhook subscription is disabled and cannot dispatch deliveries.',
        'delivery_failed'               => 'The webhook delivery failed. See `error_message` for details.',
        'invalid_destination_config'    => 'The destination configuration is invalid. See `errors` for details.',
        'signature_verification_failed' => 'The inbound webhook signature failed verification.',
        'rate_limit_exceeded'           => 'The subscription rate limit has been exceeded — try again later.',
    ],

    'validation' => [
        'valid_destination_config'     => 'The :attribute is missing one or more required keys for the selected destination.',
        'valid_event_name'             => 'The :attribute must be a known webhook event name (e.g. `invitation.sent`).',
        'valid_signing_secret'         => 'The :attribute must be a hex-encoded string of at least 32 bytes.',
        'supported_backoff_strategy'   => 'The :attribute must reference a registered backoff strategy.',
    ],

    'labels' => [
        'subscription'  => 'Webhook Subscription',
        'subscriptions' => 'Webhook Subscriptions',
        'delivery'      => 'Webhook Delivery',
        'deliveries'    => 'Webhook Deliveries',
    ],
];
