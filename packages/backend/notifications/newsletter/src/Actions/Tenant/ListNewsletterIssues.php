<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Newsletter\Contracts\Repositories\NewsletterIssueRepositoryInterface;
use Stackra\Newsletter\Data\NewsletterIssueData;
use Stackra\Newsletter\Enums\NewsletterPermission;
use Stackra\Newsletter\Models\NewsletterIssue;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/newsletters/{newsletter}/issues` — list issues for a
 * newsletter.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsAction(name: 'newsletter-issues.list')]
#[Get('/api/v1/newsletters/{newsletter}/issues')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(NewsletterPermission::IssuesViewAny)]
final class ListNewsletterIssues
{
    use AsController;

    public function __construct(
        private readonly NewsletterIssueRepositoryInterface $issues,
    ) {
    }

    /**
     * @return DataCollection<int, NewsletterIssueData>
     */
    public function __invoke(string $newsletter): DataCollection
    {
        $rows = $this->issues
            ->findForNewsletter($newsletter)
            ->map(static fn (NewsletterIssue $issue): NewsletterIssueData => NewsletterIssueData::fromModel($issue));

        return new DataCollection(NewsletterIssueData::class, $rows);
    }
}
