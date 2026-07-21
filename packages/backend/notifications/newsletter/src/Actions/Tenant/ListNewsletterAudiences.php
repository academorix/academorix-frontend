<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Newsletter\Contracts\Repositories\NewsletterAudienceRepositoryInterface;
use Stackra\Newsletter\Data\NewsletterAudienceData;
use Stackra\Newsletter\Enums\NewsletterPermission;
use Stackra\Newsletter\Models\NewsletterAudience;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
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
