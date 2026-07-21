<?php

declare(strict_types=1);

namespace Stackra\Subscription\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Subscription\Contracts\Data\PlanInterface;
use Stackra\Subscription\Contracts\Repositories\PlanRepositoryInterface;
use Stackra\Subscription\Data\PlanData;
use Stackra\Subscription\Data\Requests\CreatePlanRequestData;
use Stackra\Subscription\Enums\SubscriptionPermission;

/**
 * `POST /api/v1/platform/plans` — create a new plan in the catalogue.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsAction(name: 'subscription.platform.plans.create')]
#[Post('/api/v1/platform/plans')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:foundation-platform'])]
#[RequirePermission(SubscriptionPermission::PlatformPlansCreate)]
final class CreatePlan
{
    use AsController;

    public function __construct(
        private readonly PlanRepositoryInterface $plans,
    ) {
    }

    public function __invoke(CreatePlanRequestData $data): PlanData
    {
        $plan = $this->plans->create([
            PlanInterface::ATTR_APPLICATION_ID       => $data->applicationId,
            PlanInterface::ATTR_KEY                  => $data->key,
            PlanInterface::ATTR_NAME                 => $data->name,
            PlanInterface::ATTR_DESCRIPTION          => $data->description,
            PlanInterface::ATTR_TIER                 => $data->tier,
            PlanInterface::ATTR_BILLING_CYCLE        => $data->billingCycle,
            PlanInterface::ATTR_BILLING_MODE         => $data->billingMode,
            PlanInterface::ATTR_PRICE_MICRO_UNITS    => $data->priceMicroUnits,
            PlanInterface::ATTR_CURRENCY             => $data->currency,
            PlanInterface::ATTR_PROVIDER_PRICE_ID    => $data->providerPriceId,
            PlanInterface::ATTR_TRIAL_DAYS           => $data->trialDays,
            PlanInterface::ATTR_DEFAULT_ENTITLEMENTS => $data->defaultEntitlements,
            PlanInterface::ATTR_INCLUDED_FEATURES    => $data->includedFeatures,
            PlanInterface::ATTR_IS_PUBLIC            => $data->isPublic,
            PlanInterface::ATTR_IS_DEPRECATED        => $data->isDeprecated,
            PlanInterface::ATTR_SORT_ORDER           => $data->sortOrder,
        ]);

        return PlanData::fromModel($plan);
    }
}
