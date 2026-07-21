<?php

/**
 * @file modules/notifications/notifications-mail/lang/en/notifications-mail.php
 *
 * @description
 * English translations for the `stackra/notifications-mail`
 * module. Every error `i18n_key` in the blueprint's `errors.json`
 * resolves to a message under `notifications.mail.errors.*` here.
 */

declare(strict_types=1);

return [
    'errors' => [
        'suppressed_address' => 'The recipient address is on the mail suppression list — the message will not be delivered.',
        'hard_bounce' => 'The recipient address hard-bounced; it has been added to the suppression list.',
        'soft_bounce' => 'The recipient address soft-bounced; the send will be retried.',
        'complaint' => 'The recipient marked a previous message as spam; the address has been suppressed.',
        'provider_error' => 'The mail provider returned an error. The send will be retried.',
        'provider_disabled' => 'The mail provider is disabled via kill switch. Delivery holds until an alternate provider is available.',
        'rate_limited' => 'The mail provider is rate-limiting requests. Retrying with backoff.',
        'template_render_failed' => 'The email template failed to render. This is a template bug — please contact support.',
        'webhook_signature_invalid' => 'The provider webhook signature failed verification and was rejected.',
        'webhook_delivery_not_found' => 'The provider webhook referenced a delivery we do not have. The event was acknowledged and dropped.',
        'invalid_sender_identity' => 'The configured sender address is not verified on the selected mail provider.',
        'missing_postal_address' => 'The tenant has no postal address configured. CAN-SPAM requires one for marketing-priority mail.',
        'suppression_not_found' => 'The requested mail suppression does not exist or is not visible to you.',
        'suppression_system_immutable' => 'This suppression row is platform-managed and cannot be modified.',
        'suppression_hard_bounce_immutable' => 'Hard-bounce suppressions cannot be revoked without the --force flag.',
    ],

    'labels' => [
        'suppression' => 'Mail suppression',
        'suppressions' => 'Mail suppressions',
        'reason' => 'Reason',
        'provider' => 'Provider',
        'email' => 'Email address',
        'expires_at' => 'Expires at',
    ],
];
