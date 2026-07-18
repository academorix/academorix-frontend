<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Newsletter\Contracts\Repositories\NewsletterIssueRepositoryInterface;
use Academorix\Newsletter\Data\NewsletterIssueData;
use Academorix\Newsletter\Enums\NewsletterPermission;
use Academorix\Newsletter\Models\NewsletterIssue;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
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
