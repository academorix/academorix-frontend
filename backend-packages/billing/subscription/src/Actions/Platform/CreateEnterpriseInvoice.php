<?php

declare(strict_types=1);

namespace Academorix\Subscription\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Subscription\Contracts\Data\PlanInterface;
use Academorix\Subscription\Contracts\Data\SubscriptionInterface;
use Academorix\Subscription\Contracts\Repositories\PlanRepositoryInterface;
use Academorix\Subscription\Contracts\Repositories\SubscriptionRepositoryInterface;
use Academorix\Subscription\Data\Requests\EnterpriseInvoiceRequestData;
use Academorix\Subscription\Data\SubscriptionData;
use Academorix\Subscription\Enums\BillingMode;
use Academorix\Subscription\Enums\SubscriptionProvider;
use Academorix\Subscription\Enums\SubscriptionState;
use Academorix\Subscription\Exceptions\EnterpriseInvoiceInvalidException;
use Academorix\Subscription\Exceptions\PlanNotFoundException;

/**
 * `POST /api/v1/platform/subscriptions/{tenant}/enterprise-invoice`
 * — create an offline-billed subscription for a tenant.
 *
 * The target plan must be `billing_mode=invoice`. No Cashier
 * round-trip; the subscription is provisioned in `active` state
 * with the provider set to `invoice`.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsAction(name: 'subscription.platform.subscriptions.enterprise_invoice')]
#[Post('/api/v1/platform/subscriptions/{tenant}/enterprise-invoice')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:foundation-platform'])]
#[RequirePermission(SubscriptionPermission::PlatformSubscriptionsEnterprise)]
final class CreateEnterpriseInvoice
{
    use AsController;

    public function __construct(
        private readonly PlanRepositoryInterface $plans,
        private readonly SubscriptionRepositoryInterface $subscriptions,
    ) {
    }

    public function __invoke(string $tenant, EnterpriseInvoiceRequestData $data): SubscriptionData
    {
        $plan = $this->plans->find($data->planId);
        if ($plan === null) {
            throw new PlanNotFoundException(\sprintf('Plan "%s" not found.', $data->planId));
        }

        $billingMode = $plan->{PlanInterface::ATTR_BILLING_MODE};
        $billingModeValue = $billingMode instanceof BillingMode ? $billingMode->value : (string) $billingMode;
        if ($billingModeValue !== BillingMode::Invoice->value) {
            throw new EnterpriseInvoiceInvalidException(
                'Enterprise invoice subscription requires a plan with billing_mode=invoice.',
            );
        }

        $subscription = $this->subscriptions->create([
            SubscriptionInterface::ATTR_TENANT_ID            => $tenant,
            SubscriptionInterface::ATTR_APPLICATION_ID       => (string) $plan->{PlanInterface::ATTR_APPLICATION_ID},
            SubscriptionInterface::ATTR_PLAN_ID              => (string) $plan->getKey(),
            SubscriptionInterface::ATTR_PROVIDER             => SubscriptionProvider::Invoice->value,
            SubscriptionInterface::ATTR_STATE                => SubscriptionState::Active->value,
            SubscriptionInterface::ATTR_BILLING_CYCLE        => $plan->{PlanInterface::ATTR_BILLING_CYCLE},
            SubscriptionInterface::ATTR_CURRENT_PERIOD_START => \now(),
            SubscriptionInterface::ATTR_CURRENT_PERIOD_END   => $data->dueDate,
            SubscriptionInterface::ATTR_METADATA             => [
                'invoice_number' => $data->invoiceNumber,
                'due_date'       => $data->dueDate,
                'notes'          => $data->notes,
            ],
        ]);

        return SubscriptionData::fromModel($subscription->refresh());
    }
}
