<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Newsletter\Contracts\Repositories\NewsletterAudienceRepositoryInterface;
use Academorix\Newsletter\Data\NewsletterAudienceData;
use Academorix\Newsletter\Enums\NewsletterPermission;
use Academorix\Newsletter\Models\NewsletterAudience;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/newsletters/{newsletter}/audiences` — list audiences.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletter-audiences.list')]
#[Get('/api/v1/newsletters/{newsletter}/audiences')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NewsletterPermission::AudiencesViewAny)]
final class ListNewsletterAudiences
{
    use AsController;

    public function __construct(
        private readonly NewsletterAudienceRepositoryInterface $audiences,
    ) {
    }

    /**
     * @return DataCollection<int, NewsletterAudienceData>
     */
    public function __invoke(string $newsletter): DataCollection
    {
        $rows = $this->audiences
            ->findForNewsletter($newsletter)
            ->map(static fn (NewsletterAudience $a): NewsletterAudienceData => NewsletterAudienceData::fromModel($a));

        return new DataCollection(NewsletterAudienceData::class, $rows);
    }
}
