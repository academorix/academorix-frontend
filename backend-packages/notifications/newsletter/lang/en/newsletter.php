<?php

/**
 * @file modules/notifications/newsletter/lang/en/newsletter.php
 *
 * @description
 * English translations for the `academorix/newsletter` module.
 */

declare(strict_types=1);

return [
    'errors' => [
        'quota_exceeded'                 => 'The newsletter publications quota has been reached for this tenant.',
        'subscribers_quota_exceeded'     => 'The subscribers quota has been reached for this newsletter.',
        'campaigns_quota_exceeded'       => 'The campaigns quota has been reached for this newsletter.',
        'state_invalid_transition'       => 'The requested state transition is not allowed from the current state.',
        'throttled'                      => 'This newsletter has been auto-throttled by the reputation guardrail. Manual review required.',
        'archived'                       => 'This newsletter is archived and cannot receive new writes.',
        'token_invalid'                  => 'The confirmation or unsubscribe token is invalid or expired.',
        'already_confirmed'              => 'This subscription has already been confirmed.',
        'email_suppressed'               => 'This email address is on the suppression list and cannot be subscribed.',
        'preference_opted_out'           => 'The user has opted out of newsletter marketing and cannot be force-subscribed.',
        'audience_expression_invalid'    => 'The audience expression is invalid.',
        'campaign_already_in_progress'   => 'This campaign is already in progress and cannot be cancelled.',
        'kill_switched'                  => 'Newsletter sending is currently unavailable — please retry shortly.',
        'consent_evidence_missing'       => 'The import row is missing the required consent evidence column.',
        'newsletter_not_found'           => 'The requested newsletter does not exist.',
        'issue_not_found'                => 'The requested newsletter issue does not exist.',
        'subscription_not_found'         => 'The requested newsletter subscription does not exist.',
        'campaign_not_found'             => 'The requested newsletter campaign does not exist.',
        'audience_not_found'             => 'The requested newsletter audience does not exist.',
    ],

    'validation' => [
        'valid_double_opt_in_token'  => 'The :attribute must be a valid, unexpired double opt-in token.',
        'supported_newsletter_cadence' => 'The :attribute must reference a supported cadence.',
    ],

    'labels' => [
        'newsletter'   => 'Newsletter',
        'newsletters'  => 'Newsletters',
        'issue'        => 'Newsletter Issue',
        'issues'       => 'Newsletter Issues',
        'subscription' => 'Subscription',
        'subscriptions' => 'Subscriptions',
        'campaign'     => 'Campaign',
        'campaigns'    => 'Campaigns',
        'audience'     => 'Audience',
        'audiences'    => 'Audiences',
    ],
];
