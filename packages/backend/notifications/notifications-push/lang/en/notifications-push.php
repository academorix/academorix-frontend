<?php

/**
 * @file modules/notifications/notifications-push/lang/en/notifications-push.php
 *
 * @description
 * English translations for the `stackra/notifications-push` module. Loaded
 * under the `notifications-push::` namespace.
 */

declare(strict_types=1);

return [
    'errors' => [
        'invalid_token'            => 'The device token is no longer valid.',
        'provider_error'           => 'The push provider returned an error. The delivery will be retried.',
        'provider_disabled'        => 'The configured push provider is currently disabled.',
        'quota_exceeded'           => 'This tenant has reached its monthly push quota.',
        'subscriptions_max'        => 'This user has reached the maximum number of registered devices. Revoke one before registering another.',
        'token_validation_failed'  => 'The provider rejected the device token. Regenerate it in the app and retry.',
        'coppa_blocked'            => 'Marketing pushes to minors without verified parental consent are not permitted.',
        'payload_too_large'        => 'The push payload exceeds the provider limit.',
    ],

    'labels' => [
        'push_subscription'  => 'Push Subscription',
        'push_subscriptions' => 'Push Subscriptions',
        'provider'           => 'Provider',
        'platform'           => 'Platform',
        'device_name'        => 'Device Name',
    ],
];
