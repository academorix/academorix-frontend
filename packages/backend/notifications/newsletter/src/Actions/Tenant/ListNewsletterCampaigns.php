<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Newsletter\Contracts\Data\NewsletterCampaignInterface;
use Stackra\Newsletter\Data\NewsletterCampaignData;
use Stackra\Newsletter\Enums\NewsletterPermission;
use Stackra\Newsletter\Models\NewsletterCampaign;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/newsletters/{newsletter}/campaigns` — list campaigns.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletter-campaigns.list')]
#[Get('/api/v1/newsletters/{newsletter}/campaigns')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NewsletterPermission::CampaignsViewAny)]
final class ListNewsletterCampaigns
{
    use AsController;

    /**
     * @return DataCollection<int, NewsletterCampaignData>
     */
    public function __invoke(string $newsletter): DataCollection
    {
        $rows = NewsletterCampaign::query()
            ->where(NewsletterCampaignInterface::ATTR_NEWSLETTER_ID, $newsletter)
            ->orderByDesc(NewsletterCampaignInterface::ATTR_CREATED_AT)
            ->limit(200)
            ->get()
            ->map(static fn (NewsletterCampaign $c): NewsletterCampaignData => NewsletterCampaignData::fromModel($c));

        return new DataCollection(NewsletterCampaignData::class, $rows);
    }
}
