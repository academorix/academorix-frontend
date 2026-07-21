<?php

/**
 * @file modules/notifications/notifications/lang/en/notifications.php
 *
 * @description
 * English translations for the `stackra/notifications` module.
 */

declare(strict_types=1);

return [
    'errors' => [
        'template_not_found'                => 'A template was not found for the requested category, channel, and locale.',
        'template_invalid'                  => 'The template body failed validation.',
        'category_not_registered'           => 'The category was not registered with the notifications substrate.',
        'channel_disabled'                  => 'The requested channel is currently disabled.',
        'quota_exceeded'                    => 'You have reached your notification quota for this channel.',
        'unsubscribed'                      => 'The recipient is unsubscribed from this category on this channel.',
        'digest_already_delivered'          => 'A digest for this window was already delivered.',
        'dispatch_invalid_payload'          => 'The dispatch payload does not match the category variable schema.',
        'recipient_missing'                 => 'The dispatch call did not provide a recipient and none could be inferred.',
        'recipient_ineligible'              => 'The recipient is not eligible for this category (consent gate).',
        'tenant_suspended'                  => 'The tenant is suspended — dispatch is queued but not delivered.',
        'unsubscribe_token_invalid'         => 'The unsubscribe link is invalid or has expired.',
        'preference_update_forbidden'       => 'You cannot opt out of this category — it is transactional_required.',
        'template_live_send_reference'      => 'The template cannot be deleted because live notifications reference it.',
        'dispatch_kill_switched'            => 'Notifications dispatch is temporarily suspended.',
        'not_found'                         => 'The requested notification does not exist or is not visible to you.',
    ],

    'labels' => [
        'notification'            => 'Notification',
        'notifications'           => 'Notifications',
        'inbox'                   => 'Inbox',
        'preferences'             => 'Preferences',
        'template'                => 'Template',
        'templates'               => 'Templates',
        'category'                => 'Category',
        'categories'              => 'Categories',
        'delivery'                => 'Delivery',
        'deliveries'              => 'Deliveries',
        'digest'                  => 'Digest',
        'digests'                 => 'Digests',
    ],

    'validation' => [
        'template_key_format'  => 'The :attribute must be a valid dot-separated template key (module.event).',
        'supported_channel'    => 'The :attribute must be a supported delivery channel (mail, sms, push, in_app).',
        'valid_locale'         => 'The :attribute must be a valid ISO 639-1 locale.',
        'recipient_shape'      => 'The :attribute must be a valid recipient shape.',
    ],
];
