<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Newsletter\Contracts\Data\NewsletterCampaignInterface;
use Academorix\Newsletter\Data\NewsletterCampaignData;
use Academorix\Newsletter\Enums\NewsletterPermission;
use Academorix\Newsletter\Models\NewsletterCampaign;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
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
