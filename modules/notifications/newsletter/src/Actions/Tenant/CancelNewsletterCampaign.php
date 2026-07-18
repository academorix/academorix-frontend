<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Newsletter\Contracts\Services\NewsletterServiceInterface;
use Academorix\Newsletter\Data\NewsletterCampaignData;
use Academorix\Newsletter\Data\Requests\CancelCampaignRequestData;
use Academorix\Newsletter\Enums\NewsletterPermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;

/**
 * `POST /api/v1/newsletters/{newsletter}/campaigns/{campaign}/cancel`
 * — cancel a pending or in-progress campaign.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletter-campaigns.cancel')]
#[Post('/api/v1/newsletters/{newsletter}/campaigns/{campaign}/cancel')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NewsletterPermission::CampaignsManage)]
final class CancelNewsletterCampaign
{
    use AsController;

    public function __construct(
        private readonly NewsletterServiceInterface $service,
    ) {
    }

    public function __invoke(
        string $newsletter,
        string $campaign,
        CancelCampaignRequestData $data,
    ): NewsletterCampaignData {
        $model = $this->service->cancelCampaign($campaign, $data->reason);

        return NewsletterCampaignData::fromModel($model);
    }
}
