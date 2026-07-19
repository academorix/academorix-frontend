<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Newsletter\Contracts\Repositories\NewsletterAudienceRepositoryInterface;
use Academorix\Newsletter\Data\NewsletterAudienceData;
use Academorix\Newsletter\Enums\NewsletterPermission;
use Academorix\Newsletter\Exceptions\NewsletterAudienceNotFoundException;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;

/**
 * `GET /api/v1/newsletters/{newsletter}/audiences/{audience}` — show
 * a single audience.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletter-audiences.show')]
#[Get('/api/v1/newsletters/{newsletter}/audiences/{audience}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NewsletterPermission::AudiencesView)]
final class ShowNewsletterAudience
{
    use AsController;

    public function __construct(
        private readonly NewsletterAudienceRepositoryInterface $audiences,
    ) {
    }

    public function __invoke(string $newsletter, string $audience): NewsletterAudienceData
    {
        $model = $this->audiences->find($audience);
        if ($model === null) {
            throw new NewsletterAudienceNotFoundException('Audience not found.');
        }

        return NewsletterAudienceData::fromModel($model);
    }
}
