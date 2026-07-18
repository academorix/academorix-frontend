<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Newsletter\Contracts\Data\NewsletterInterface;
use Academorix\Newsletter\Contracts\Repositories\NewsletterRepositoryInterface;
use Academorix\Newsletter\Data\NewsletterData;
use Academorix\Newsletter\Data\Requests\CreateNewsletterRequestData;
use Academorix\Newsletter\Enums\NewsletterPermission;
use Academorix\Newsletter\Enums\NewsletterStatus;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;

/**
 * `POST /api/v1/newsletters` — create a new newsletter publication.
 *
 * The observer normalises the slug + applies default reputation
 * thresholds before insert; this action only translates the
 * validated payload into the repository call.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletters.create')]
#[Post('/api/v1/newsletters')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NewsletterPermission::NewslettersCreate)]
final class CreateNewsletter
{
    use AsController;

    public function __construct(
        private readonly NewsletterRepositoryInterface $newsletters,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(CreateNewsletterRequestData $data): NewsletterData
    {
        $tenant = $this->tenantContext->currentOrFail();

        $newsletter = $this->newsletters->create([
            NewsletterInterface::ATTR_TENANT_ID              => (string) $tenant->getKey(),
            NewsletterInterface::ATTR_SLUG                   => $data->slug,
            NewsletterInterface::ATTR_NAME                   => $data->name,
            NewsletterInterface::ATTR_DESCRIPTION            => $data->description,
            NewsletterInterface::ATTR_CADENCE                => $data->cadence->value,
            NewsletterInterface::ATTR_STATUS                 => NewsletterStatus::Draft->value,
            NewsletterInterface::ATTR_CONFIRMATION_REQUIRED  => $data->confirmationRequired,
            NewsletterInterface::ATTR_SENDER_CONFIG          => $data->senderConfig,
            NewsletterInterface::ATTR_BRAND                  => $data->brand,
            NewsletterInterface::ATTR_REPUTATION_THRESHOLDS  => $data->reputationThresholds,
        ]);

        return NewsletterData::fromModel($newsletter->refresh());
    }
}
