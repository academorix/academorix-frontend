<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Newsletter\Contracts\Services\NewsletterServiceInterface;
use Stackra\Newsletter\Data\NewsletterCampaignData;
use Stackra\Newsletter\Data\Requests\CancelCampaignRequestData;
use Stackra\Newsletter\Enums\NewsletterPermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;

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
