<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Newsletter\Contracts\Repositories\NewsletterAudienceRepositoryInterface;
use Academorix\Newsletter\Data\NewsletterAudienceData;
use Academorix\Newsletter\Enums\NewsletterPermission;
use Academorix\Newsletter\Exceptions\NewsletterAudienceNotFoundException;
use Academorix\Newsletter\Jobs\BuildAudienceSegmentJob;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;

/**
 * `POST /api/v1/newsletters/{newsletter}/audiences/{audience}/refresh`
 * — force re-evaluate the audience expression + refresh the cached
 * subscriber list.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletter-audiences.refresh')]
#[Post('/api/v1/newsletters/{newsletter}/audiences/{audience}/refresh')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NewsletterPermission::AudiencesUpdate)]
final class RefreshNewsletterAudience
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

        BuildAudienceSegmentJob::dispatch((string) $model->getKey());

        return NewsletterAudienceData::fromModel($model);
    }
}
