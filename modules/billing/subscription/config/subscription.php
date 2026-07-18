<?php

/**
 * @file modules/billing/subscription/config/subscription.php
 *
 * @description
 * Runtime knobs for the `academorix/subscription` module. Every knob
 * is env-overridable so per-environment tuning stays out of code.
 */

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Cashier
    |--------------------------------------------------------------------------
    |
    | Cashier variant per payment provider. Application.payment_provider
    | selects which variant boots for a given tenant; the `default_provider`
    | fallback is used when Application.payment_provider is null.
    */
    'cashier' => [
        'default_provider' => env('CASHIER_DEFAULT_PROVIDER', 'stripe'),
        'stripe' => [
            'key'            => env('STRIPE_KEY'),
            'secret'         => env('STRIPE_SECRET'),
            'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
        ],
        'paddle' => [
            'seller_id'      => env('PADDLE_SELLER_ID'),
            'auth_code'      => env('PADDLE_AUTH_CODE'),
            'webhook_secret' => env('PADDLE_WEBHOOK_SECRET'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Trial
    |--------------------------------------------------------------------------
    |
    | `default_days` is the fallback trial length when Plan.trial_days is
    | zero but the tenant explicitly opts into a trial. `warning_days_before`
    | is when `ExpireTrialsJob` fires `TrialEnding` — three days ahead by
    | default so the tenant has time to add a payment method.
    */
    'trial' => [
        'default_days'         => env('SUBSCRIPTION_TRIAL_DEFAULT_DAYS', 14),
        'warning_days_before'  => env('SUBSCRIPTION_TRIAL_WARNING_DAYS', 3),
    ],

    /*
    |--------------------------------------------------------------------------
    | Dunning
    |--------------------------------------------------------------------------
    |
    | Grace-period progression beyond the provider default. Modifying the
    | stages changes the dunning UX — the state machine reads this array
    | as the source of truth.
    */
    'dunning' => [
        'stages' => [
            [
                'stage'              => 'at_risk',
                'days_from_past_due' => 1,
                'duration_days'      => 7,
                'restrictions'       => [],
            ],
            [
                'stage'              => 'grace',
                'days_from_past_due' => 8,
                'duration_days'      => 7,
                'restrictions'       => ['readonly_non_critical'],
            ],
            [
                'stage'              => 'suspended',
                'days_from_past_due' => 15,
                'duration_days'      => 7,
                'restrictions'       => ['full_suspension_except_billing_pages'],
            ],
            [
                'stage'              => 'cancelled',
                'days_from_past_due' => 22,
                'duration_days'      => null,
                'restrictions'       => ['full_cancellation'],
            ],
        ],
        'max_recovery_attempts' => env('SUBSCRIPTION_DUNNING_MAX_RETRIES', 4),
    ],

    /*
    |--------------------------------------------------------------------------
    | Swap
    |--------------------------------------------------------------------------
    |
    | Plan-swap semantics. Upgrades prorate; downgrades take effect at
    | period end (fair-usage — the customer already paid for this
    | period).
    */
    'swap' => [
        'prorate_on_upgrade'                     => env('SUBSCRIPTION_SWAP_PRORATE', true),
        'effective_at_period_end_on_downgrade'   => env('SUBSCRIPTION_SWAP_DOWNGRADE_DEFERRED', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Reconciliation
    |--------------------------------------------------------------------------
    |
    | Hourly reconciliation samples our Subscription state against Cashier's
    | provider-side state. `sample_size` is the number of subscriptions
    | sampled per run. High-value / enterprise subscriptions are weighted
    | more heavily by `high_value_weight`.
    */
    'reconciliation' => [
        'sample_size'       => env('SUBSCRIPTION_RECONCILE_SAMPLE_SIZE', 100),
        'high_value_weight' => (float) env('SUBSCRIPTION_RECONCILE_WEIGHT', 3.0),
    ],

    /*
    |--------------------------------------------------------------------------
    | Retention
    |--------------------------------------------------------------------------
    |
    | SubscriptionEvent is 7-year SOX evidence. Plan + Subscription rows are
    | soft-deleted; the runner reads these windows to trigger cold-archival
    | rather than hard-purge.
    */
    'retention' => [
        'subscription_event_days' => env('SUBSCRIPTION_EVENT_RETENTION_DAYS', 2555),
        'plan_hard_delete_days'   => env('SUBSCRIPTION_PLAN_HARD_DELETE_DAYS', 1095),
    ],
];
