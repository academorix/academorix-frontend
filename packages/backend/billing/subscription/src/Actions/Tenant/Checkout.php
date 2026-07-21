<?php

declare(strict_types=1);

namespace Stackra\Subscription\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Subscription\Contracts\Repositories\PlanRepositoryInterface;
use Stackra\Subscription\Contracts\Services\BillingServiceInterface;
use Stackra\Subscription\Data\Requests\CheckoutRequestData;
use Stackra\Subscription\Enums\SubscriptionPermission;
use Stackra\Subscription\Exceptions\CheckoutProviderErrorException;
use Stackra\Subscription\Exceptions\PlanNotFoundException;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Illuminate\Http\JsonResponse;

/**
 * `POST /api/v1/subscription/checkout` — return the provider's
 * checkout session URL for the requested plan.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsAction(name: 'subscription.tenant.checkout')]
#[Post('/api/v1/subscription/checkout')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(SubscriptionPermission::SubscriptionManage)]
final class Checkout
{
    use AsController;

    public function __construct(
        private readonly PlanRepositoryInterface $plans,
        private readonly BillingServiceInterface $billing,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(CheckoutRequestData $data): JsonResponse
    {
        $tenant = $this->tenantContext->currentOrFail();
        $plan = $this->plans->find($data->planId);

        if ($plan === null) {
            throw new PlanNotFoundException(\sprintf('Plan "%s" not found.', $data->planId));
        }

        $checkoutUrl = $this->billing->startCheckout((string) $tenant->getKey(), $plan);

        if ($checkoutUrl === null) {
            // Invoice-billed plan — surface a different code path.
            return response()->json([
                'requires_offline_processing' => true,
                'plan_id'                     => (string) $plan->getKey(),
            ], JsonResponse::HTTP_ACCEPTED);
        }

        if ($checkoutUrl === '') {
            throw new CheckoutProviderErrorException('Provider returned an empty checkout URL.');
        }

        return response()->json(['checkout_url' => $checkoutUrl], JsonResponse::HTTP_OK);
    }
}
