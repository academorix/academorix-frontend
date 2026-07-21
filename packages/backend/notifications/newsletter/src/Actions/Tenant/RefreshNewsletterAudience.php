<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Newsletter\Contracts\Repositories\NewsletterAudienceRepositoryInterface;
use Stackra\Newsletter\Data\NewsletterAudienceData;
use Stackra\Newsletter\Enums\NewsletterPermission;
use Stackra\Newsletter\Exceptions\NewsletterAudienceNotFoundException;
use Stackra\Newsletter\Jobs\BuildAudienceSegmentJob;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;

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
