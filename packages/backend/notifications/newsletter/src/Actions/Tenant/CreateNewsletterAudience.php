<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Newsletter\Contracts\Data\NewsletterAudienceInterface;
use Stackra\Newsletter\Contracts\Data\NewsletterInterface;
use Stackra\Newsletter\Contracts\Repositories\NewsletterAudienceRepositoryInterface;
use Stackra\Newsletter\Contracts\Repositories\NewsletterRepositoryInterface;
use Stackra\Newsletter\Data\NewsletterAudienceData;
use Stackra\Newsletter\Data\Requests\CreateAudienceRequestData;
use Stackra\Newsletter\Enums\NewsletterPermission;
use Stackra\Newsletter\Exceptions\NewsletterNotFoundException;
use Stackra\Newsletter\Jobs\BuildAudienceSegmentJob;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;

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
