<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Newsletter\Contracts\Repositories\NewsletterCampaignRepositoryInterface;
use Stackra\Newsletter\Data\NewsletterCampaignData;
use Stackra\Newsletter\Enums\NewsletterPermission;
use Stackra\Newsletter\Exceptions\NewsletterCampaignNotFoundException;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;

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
