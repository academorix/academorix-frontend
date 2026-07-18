<?php

declare(strict_types=1);

namespace Academorix\Subscription\Console;

use Academorix\Console\Attributes\AsCommand;
use Academorix\Console\Console\Commands\BaseCommand;
use Academorix\Subscription\Contracts\Data\SubscriptionInterface;
use Academorix\Subscription\Contracts\Repositories\SubscriptionRepositoryInterface;

/**
 * `php artisan subscription:describe --tenant=<id>` — print the
 * tenant's current subscription: plan, state, grace_ends_at,
 * next invoice.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsCommand(
    name: 'subscription:describe',
    description: 'Print a tenant\'s current subscription state.',
)]
final class SubscriptionDescribeCommand extends BaseCommand
{
    /**
     * @var string
     */
    protected $signature = 'subscription:describe
        {--tenant= : Tenant id to inspect}';

    public function handle(SubscriptionRepositoryInterface $subscriptions): int
    {
        $this->omni->titleBar('Subscription — Describe', 'sky');

        $tenantId = $this->option('tenant');
        if (! \is_string($tenantId) || $tenantId === '') {
            $this->omni->error('The --tenant option is required.');
            $this->showDuration();

            return self::FAILURE;
        }

        $subscription = $subscriptions->findActiveForTenant($tenantId);
        if ($subscription === null) {
            $this->omni->warning(\sprintf('No active subscription for tenant "%s".', $tenantId));
            $this->showDuration();

            return self::SUCCESS;
        }

        $this->omni->dataList(
            [
                'id'              => (string) $subscription->getKey(),
                'tenant_id'       => (string) $subscription->{SubscriptionInterface::ATTR_TENANT_ID},
                'application_id'  => (string) $subscription->{SubscriptionInterface::ATTR_APPLICATION_ID},
                'plan_id'         => (string) $subscription->{SubscriptionInterface::ATTR_PLAN_ID},
                'provider'        => (string) $subscription->{SubscriptionInterface::ATTR_PROVIDER},
                'state'           => (string) $subscription->{SubscriptionInterface::ATTR_STATE},
                'billing_cycle'   => (string) $subscription->{SubscriptionInterface::ATTR_BILLING_CYCLE},
                'grace_ends_at'   => (string) $subscription->{SubscriptionInterface::ATTR_GRACE_ENDS_AT},
                'trial_ends_at'   => (string) $subscription->{SubscriptionInterface::ATTR_TRIAL_ENDS_AT},
                'next_period_end' => (string) $subscription->{SubscriptionInterface::ATTR_CURRENT_PERIOD_END},
            ],
            title: 'Subscription',
        );

        $this->showDuration();

        return self::SUCCESS;
    }
}
