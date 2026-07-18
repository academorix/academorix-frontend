<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Newsletter\Contracts\Data\NewsletterAudienceInterface;
use Academorix\Newsletter\Contracts\Data\NewsletterInterface;
use Academorix\Newsletter\Contracts\Repositories\NewsletterAudienceRepositoryInterface;
use Academorix\Newsletter\Contracts\Repositories\NewsletterRepositoryInterface;
use Academorix\Newsletter\Data\NewsletterAudienceData;
use Academorix\Newsletter\Data\Requests\CreateAudienceRequestData;
use Academorix\Newsletter\Enums\NewsletterPermission;
use Academorix\Newsletter\Exceptions\NewsletterNotFoundException;
use Academorix\Newsletter\Jobs\BuildAudienceSegmentJob;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;

/**
 * `POST /api/v1/newsletters/{newsletter}/audiences` — create an
 * audience segment.
 *
 * Dispatches {@see BuildAudienceSegmentJob} immediately so the
 * cached subscriber list gets populated for the new segment.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletter-audiences.create')]
#[Post('/api/v1/newsletters/{newsletter}/audiences')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NewsletterPermission::AudiencesCreate)]
final class CreateNewsletterAudience
{
    use AsController;

    public function __construct(
        private readonly NewsletterAudienceRepositoryInterface $audiences,
        private readonly NewsletterRepositoryInterface $newsletters,
    ) {
    }

    public function __invoke(string $newsletter, CreateAudienceRequestData $data): NewsletterAudienceData
    {
        $parent = $this->newsletters->find($newsletter);
        if ($parent === null) {
            throw new NewsletterNotFoundException('Newsletter not found.');
        }

        $audience = $this->audiences->create([
            NewsletterAudienceInterface::ATTR_TENANT_ID     => (string) $parent->{NewsletterInterface::ATTR_TENANT_ID},
            NewsletterAudienceInterface::ATTR_NEWSLETTER_ID => (string) $parent->getKey(),
            NewsletterAudienceInterface::ATTR_SLUG          => $data->slug,
            NewsletterAudienceInterface::ATTR_NAME          => $data->name,
            NewsletterAudienceInterface::ATTR_DESCRIPTION   => $data->description,
            NewsletterAudienceInterface::ATTR_EXPRESSION    => $data->expression,
            NewsletterAudienceInterface::ATTR_IS_DEFAULT    => false,
        ]);

        BuildAudienceSegmentJob::dispatch((string) $audience->getKey());

        return NewsletterAudienceData::fromModel($audience->refresh());
    }
}
