<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Newsletter\Contracts\Repositories\NewsletterCampaignRepositoryInterface;
use Academorix\Newsletter\Data\NewsletterCampaignData;
use Academorix\Newsletter\Enums\NewsletterPermission;
use Academorix\Newsletter\Exceptions\NewsletterCampaignNotFoundException;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;

/**
 * `GET /api/v1/newsletters/{newsletter}/campaigns/{campaign}` — show
 * a single campaign.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletter-campaigns.show')]
#[Get('/api/v1/newsletters/{newsletter}/campaigns/{campaign}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NewsletterPermission::CampaignsView)]
final class ShowNewsletterCampaign
{
    use AsController;

    public function __construct(
        private readonly NewsletterCampaignRepositoryInterface $campaigns,
    ) {
    }

    public function __invoke(string $newsletter, string $campaign): NewsletterCampaignData
    {
        $model = $this->campaigns->find($campaign);
        if ($model === null) {
            throw new NewsletterCampaignNotFoundException('Campaign not found.');
        }

        return NewsletterCampaignData::fromModel($model);
    }
}
