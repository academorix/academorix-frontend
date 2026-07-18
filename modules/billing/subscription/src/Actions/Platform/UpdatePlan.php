<?php

declare(strict_types=1);

namespace Academorix\Subscription\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Patch;
use Academorix\Routing\Concerns\AsController;
use Academorix\Subscription\Contracts\Data\PlanInterface;
use Academorix\Subscription\Contracts\Repositories\PlanRepositoryInterface;
use Academorix\Subscription\Data\PlanData;
use Academorix\Subscription\Data\Requests\UpdatePlanRequestData;
use Academorix\Subscription\Enums\SubscriptionPermission;
use Academorix\Subscription\Exceptions\PlanNotFoundException;

/**
 * `PATCH /api/v1/platform/plans/{plan}` — update a plan's fields.
 *
 * Only the columns present in the request are updated. `is_system`
 * plans are rejected by the policy before the action runs.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsAction(name: 'subscription.platform.plans.update')]
#[Patch('/api/v1/platform/plans/{plan}')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:foundation-platform'])]
#[RequirePermission(SubscriptionPermission::PlatformPlansUpdate)]
final class UpdatePlan
{
    use AsController;

    public function __construct(
        private readonly PlanRepositoryInterface $plans,
    ) {
    }

    public function __invoke(string $plan, UpdatePlanRequestData $data): PlanData
    {
        $row = $this->plans->find($plan);
        if ($row === null) {
            throw new PlanNotFoundException(\sprintf('Plan "%s" not found.', $plan));
        }

        $attributes = \array_filter(
            [
                PlanInterface::ATTR_NAME                 => $data->name,
                PlanInterface::ATTR_DESCRIPTION          => $data->description,
                PlanInterface::ATTR_PRICE_MICRO_UNITS    => $data->priceMicroUnits,
                PlanInterface::ATTR_CURRENCY             => $data->currency,
                PlanInterface::ATTR_TRIAL_DAYS           => $data->trialDays,
                PlanInterface::ATTR_PROVIDER_PRICE_ID    => $data->providerPriceId,
                PlanInterface::ATTR_DEFAULT_ENTITLEMENTS => $data->defaultEntitlements,
                PlanInterface::ATTR_INCLUDED_FEATURES    => $data->includedFeatures,
                PlanInterface::ATTR_IS_PUBLIC            => $data->isPublic,
                PlanInterface::ATTR_IS_DEPRECATED        => $data->isDeprecated,
                PlanInterface::ATTR_SORT_ORDER           => $data->sortOrder,
            ],
            // Filter out null values so the update patches only the
            // supplied columns. Explicit `false` values on the
            // boolean columns are preserved because they are not
            // null.
            static fn ($value): bool => $value !== null,
        );

        $row->fill($attributes)->save();

        return PlanData::fromModel($row->refresh());
    }
}
