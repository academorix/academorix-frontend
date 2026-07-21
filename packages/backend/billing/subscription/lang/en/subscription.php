<?php

/**
 * @file modules/billing/subscription/lang/en/subscription.php
 *
 * @description
 * English translations for the `stackra/subscription` module.
 */

declare(strict_types=1);

return [
    'errors' => [
        'not_found'                   => 'Subscription not found.',
        'already_exists'              => 'Tenant already has an active subscription.',
        'active_required'             => 'This action requires an active subscription.',
        'state_not_allowed'           => 'Current subscription state does not permit this action.',
        'plan_not_found'              => 'Plan not found.',
        'plan_not_available'          => 'Plan is not available for your Application.',
        'plan_deprecated'             => 'Plan is deprecated. Choose a currently offered plan.',
        'plan_archived'               => 'Plan has been archived.',
        'plan_in_use'                 => 'Plan cannot be removed while active subscriptions exist.',
        'checkout_provider_error'     => 'Checkout could not be initiated. Please try again.',
        'payment_method_required'     => 'A payment method is required to proceed.',
        'webhook_signature_invalid'   => 'Webhook signature verification failed.',
        'webhook_duplicate'           => 'Webhook already processed.',
        'usage_report_failed'         => 'Failed to report usage to the payment provider.',
        'swap_invalid_transition'     => 'This plan swap is not allowed.',
        'enterprise_invoice_invalid'  => 'Enterprise invoice request could not be created.',
    ],

    'validation' => [
        'valid_plan_tier'    => 'The :attribute must be one of: free, team, business, enterprise, custom.',
        'valid_billing_cycle' => 'The :attribute must be one of: monthly, annual, lifetime.',
    ],

    'labels' => [
        'plan'                => 'Plan',
        'subscription'        => 'Subscription',
        'subscription_event'  => 'Subscription event',
    ],
];
